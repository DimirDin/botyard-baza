import asyncio
import logging
import os
import time

from aiogram import Bot, Dispatcher, F
from aiogram.filters import Command, CommandStart
from aiogram.types import BotCommand, InlineKeyboardButton, InlineKeyboardMarkup, Message, WebAppInfo
from aiogram.utils.deep_linking import decode_payload

MINI_APP_URL = os.environ.get("MINI_APP_URL", "https://baza.botyard.site")
CHANNEL_USERNAME = os.environ.get("CHANNEL_USERNAME", "@claudedry")
# Технический чат для модерации предложенных инструментов/промптов (см. openFeedbackChat
# на фронте). Пока не создан владельцем — тогда фидбэк уходит админам из ADMIN_TG_IDS
# (тот же .env, что у backend), а если нет и их, только логируется.
TECH_CHAT_ID = os.environ.get("TECH_CHAT_ID", "")
ADMIN_TG_IDS = os.environ.get("ADMIN_TG_IDS", "")

# Те же лимиты, что у POST /api/feedback, чтобы два входа фидбэка вели себя одинаково.
FEEDBACK_MAX_LEN = 2000
# Сколько живёт режим «пишу фидбэк». Без срока любое сообщение, отправленное через
# сутки после /feedback, молча уезжало бы модераторам как предложение.
FEEDBACK_TTL_SEC = 15 * 60

# Форматы deep link, которые понимает resolveStartParam в frontend/src/App.jsx.
# Держать в синхроне: payload, которого здесь нет, бот выбрасывает, и человек из
# ссылки в посте попадает на главную вместо урока или калькулятора. Так и было
# с guide_/calc/search до 17.10.2026.
# src_ — метка источника трафика (vc.ru, реклама...), не контентный deep link,
# но прокидывается тем же путём — Mini App сама решает, что с ней делать.
DEEP_LINK_PREFIXES = ("entry_", "tool_", "prompt_", "section_", "guide_", "src_")
DEEP_LINK_EXACT = ("tool", "prompt", "guide", "search", "calc")

dp = Dispatcher()

# tg_id → время входа в режим фидбэка (monotonic). In-memory: бот работает одним
# polling-процессом, при рестарте человек максимум потеряет незавершённый ввод.
_awaiting_feedback: dict[int, float] = {}


def _is_known(payload: str) -> bool:
    return payload in DEEP_LINK_EXACT or payload.startswith(DEEP_LINK_PREFIXES)


def parse_start_payload(text: str | None) -> str | None:
    """Достаёт deep link из `/start <payload>`.

    Шар-ссылки фронта используют сырой payload (t.me/bot?start=entry_slug):
    Main Mini App в BotFather не настроен, поэтому t.me/bot?startapp= не работает,
    deep link идёт через /start → кнопку web_app. decode_payload оставлен для
    совместимости с base64-ссылками create_start_link. base64-декод сырого текста
    может «успешно» дать мусор — доверяем ему, только если результат похож на наш
    формат."""
    parts = (text or "").split(maxsplit=1)
    if len(parts) < 2:
        return None
    raw = parts[1].strip()
    try:
        decoded = decode_payload(raw)
    except Exception:
        decoded = ""
    if _is_known(decoded):
        return decoded
    return raw if _is_known(raw) else None


def app_url(payload: str | None = None) -> str:
    return f"{MINI_APP_URL}?startapp={payload}" if payload else MINI_APP_URL


def feedback_recipients(tech_chat_id: str, admin_ids: str) -> list[str]:
    """Технический чат, а пока его нет — админы. Раньше без TECH_CHAT_ID фидбэк
    только писался в лог, а человеку бот отвечал «Записал»."""
    if tech_chat_id.strip():
        return [tech_chat_id.strip()]
    return [x.strip() for x in admin_ids.split(",") if x.strip().lstrip("-").isdigit()]


def _open_button(text: str, payload: str | None = None) -> InlineKeyboardButton:
    return InlineKeyboardButton(text=text, web_app=WebAppInfo(url=app_url(payload)))


@dp.message(CommandStart())
async def start(message: Message):
    parts = (message.text or "").split(maxsplit=1)
    if len(parts) > 1 and parts[1].strip() == "feedback":
        return await start_feedback(message)

    payload = parse_start_payload(message.text)
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [_open_button("Открыть Baza", payload)],
        [InlineKeyboardButton(text=f"Подписаться на {CHANNEL_USERNAME}",
                              url=f"https://t.me/{CHANNEL_USERNAME.lstrip('@')}")],
    ])
    await message.answer(
        "Baza без воды — энциклопедия по Claude Code / Claude.ai / API.\n\n"
        f"Доступ открыт подписчикам {CHANNEL_USERNAME}. Жми «Открыть Baza» и подтверди подписку внутри.",
        reply_markup=kb,
    )


@dp.message(Command("help"))
async def help_command(message: Message):
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [_open_button("📚 База", "section_base"), _open_button("🧰 Инструменты", "tool")],
        [_open_button("💬 Промпты", "prompt"), _open_button("🧭 Гид", "guide")],
        [_open_button("🔍 Поиск", "search"), _open_button("🧮 Калькулятор", "calc")],
    ])
    await message.answer(
        "Что внутри Baza:\n\n"
        "📚 База — статьи по Claude Code, Claude.ai и API, без воды\n"
        "🧰 Инструменты — проверенные репозитории: MCP, плагины, агенты\n"
        "💬 Промпты — готовые шаблоны с подстановкой переменных\n"
        "🧭 Гид — путь от первого диалога до продакшена, 5 уровней\n"
        "🧮 Калькулятор — токены и цена запроса по актуальным моделям\n\n"
        "/feedback — предложить инструмент или промпт\n"
        f"Доступ — для подписчиков {CHANNEL_USERNAME}.",
        reply_markup=kb,
    )


async def start_feedback(message: Message) -> None:
    _awaiting_feedback[message.from_user.id] = time.monotonic()
    await message.answer(
        "Пришли одним сообщением инструмент (ссылка на GitHub) или промпт, который стоит "
        "добавить в Baza — можно с парой слов, зачем он полезен. Я передам это на модерацию.\n\n"
        "Передумал — /cancel.",
    )


@dp.message(Command("feedback"))
async def feedback_command(message: Message):
    await start_feedback(message)


@dp.message(Command("cancel"))
async def cancel_command(message: Message):
    if _awaiting_feedback.pop(message.from_user.id, None) is not None:
        await message.answer("Ок, отменил.")
    else:
        await message.answer("Нечего отменять. Открыть Baza — /start, список разделов — /help.")


@dp.message(F.text & ~F.text.startswith("/"))
async def collect_feedback(message: Message):
    started = _awaiting_feedback.pop(message.from_user.id, None)
    if started is None or time.monotonic() - started > FEEDBACK_TTL_SEC:
        return  # обычное сообщение вне режима фидбэка — бот не чат-бот, не отвечаем

    if len(message.text) > FEEDBACK_MAX_LEN:
        _awaiting_feedback[message.from_user.id] = time.monotonic()
        await message.answer(f"Слишком длинно — уложись в {FEEDBACK_MAX_LEN} символов и пришли ещё раз.")
        return

    user = message.from_user
    who = f"@{user.username}" if user.username else user.full_name
    text = f"📩 Новое предложение от {who} (tg_id {user.id}):\n\n{message.text}"

    delivered = 0
    for chat_id in feedback_recipients(TECH_CHAT_ID, ADMIN_TG_IDS):
        try:
            await message.bot.send_message(chat_id, text)
            delivered += 1
        except Exception:
            logging.exception("не удалось доставить фидбэк в %s", chat_id)

    if delivered:
        await message.answer("Спасибо! Передал на модерацию.")
    else:
        logging.warning("фидбэк никуда не доставлен (нет TECH_CHAT_ID/ADMIN_TG_IDS или ошибка): %s", text)
        await message.answer(
            "Спасибо! Но сейчас не получилось передать сообщение модераторам. "
            "Попробуй позже или напиши через форму в самом приложении."
        )


async def main():
    logging.basicConfig(level=logging.INFO)
    bot = Bot(token=os.environ["BOT_TOKEN"])
    # Меню команд — то, что человек видит по кнопке «/» рядом с полем ввода.
    # Сбой здесь не повод не запускать бота.
    try:
        await bot.set_my_commands([
            BotCommand(command="start", description="Открыть Baza"),
            BotCommand(command="help", description="Разделы и быстрые ссылки"),
            BotCommand(command="feedback", description="Предложить инструмент или промпт"),
            BotCommand(command="cancel", description="Отменить ввод предложения"),
        ])
    except Exception:
        logging.warning("set_my_commands не удался, меню команд не обновлено", exc_info=True)
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
