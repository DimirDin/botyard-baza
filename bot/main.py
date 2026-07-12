import asyncio
import logging
import os

from aiogram import Bot, Dispatcher, F
from aiogram.filters import Command, CommandStart
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, Message
from aiogram.utils.deep_linking import decode_payload

BOT_TOKEN = os.environ["BOT_TOKEN"]
MINI_APP_URL = os.environ.get("MINI_APP_URL", "https://baza.botyard.site")
CHANNEL_USERNAME = os.environ.get("CHANNEL_USERNAME", "@claudedry")
# Технический чат для модерации предложенных инструментов/промптов (см. openFeedbackChat
# на фронте). Пока не создан владельцем — если пусто, фидбэк только логируется.
TECH_CHAT_ID = os.environ.get("TECH_CHAT_ID", "")

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

# tg_id пользователей, которые сейчас в режиме "пишут фидбэк" (после /start feedback).
# In-memory — бот работает одним polling-процессом, персистентность не нужна:
# максимум пользователь потеряет незавершённый ввод при рестарте бота.
_awaiting_feedback: set[int] = set()


@dp.message(CommandStart())
async def start(message: Message):
    # Шар-ссылки фронта используют сырой payload (t.me/bot?start=entry_slug):
    # Main Mini App в BotFather не настроен, поэтому t.me/bot?startapp= не работает,
    # deep link идёт через /start → кнопку web_app ниже. decode_payload оставлен
    # для совместимости, если когда-то появятся base64-ссылки через create_start_link.
    payload = None
    parts = message.text.split(maxsplit=1)
    if len(parts) > 1:
        raw = parts[1].strip()
        try:
            decoded = decode_payload(raw)
        except Exception:
            decoded = ""
        # base64-декод сырого текста может «успешно» дать мусор — доверяем ему,
        # только если результат похож на наш формат deep link (§16).
        # src_ — метка источника трафика (vc.ru, реклама...), не контентный deep link,
        # но прокидывается тем же путём — Mini App сама решает, что с ней делать (см. App.jsx).
        known = ("entry_", "tool_", "prompt_", "section_", "src_")
        payload = decoded if decoded.startswith(known) else (raw if raw.startswith(known) else None)
        if raw == "feedback":
            return await start_feedback(message)

    # deep link типа entry_{slug} / tool_{id} / prompt_{id} / section_{name} — см. §16
    app_url = f"{MINI_APP_URL}?startapp={payload}" if payload else MINI_APP_URL

    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="Открыть Baza", web_app={"url": app_url})],
        [InlineKeyboardButton(text=f"Подписаться на {CHANNEL_USERNAME}",
                               url=f"https://t.me/{CHANNEL_USERNAME.lstrip('@')}")],
    ])

    await message.answer(
        "Baza без воды — энциклопедия по Claude Code / Claude.ai / API.\n\n"
        f"Доступ открыт подписчикам {CHANNEL_USERNAME}. Жми «Открыть Baza» и подтверди подписку внутри.",
        reply_markup=kb,
    )


async def start_feedback(message: Message) -> None:
    _awaiting_feedback.add(message.from_user.id)
    await message.answer(
        "Пришли одним сообщением инструмент (ссылка на GitHub) или промпт, который стоит "
        "добавить в Baza — можно с парой слов, зачем он полезен. Я передам это на модерацию.",
    )


@dp.message(Command("feedback"))
async def feedback_command(message: Message):
    await start_feedback(message)


@dp.message(F.text & ~F.text.startswith("/"))
async def collect_feedback(message: Message):
    if message.from_user.id not in _awaiting_feedback:
        return  # обычное сообщение вне режима фидбэка — бот не чат-бот, не отвечаем
    _awaiting_feedback.discard(message.from_user.id)

    user = message.from_user
    who = f"@{user.username}" if user.username else user.full_name
    text = (
        f"📩 Новое предложение от {who} (tg_id {user.id}):\n\n{message.text}"
    )

    if TECH_CHAT_ID:
        await bot.send_message(TECH_CHAT_ID, text)
        await message.answer("Спасибо! Передал в технический чат на модерацию.")
    else:
        logging.warning("TECH_CHAT_ID не задан, фидбэк не отправлен: %s", text)
        await message.answer("Спасибо! Записал (технический чат ещё не подключён на стороне бота).")


async def main():
    logging.basicConfig(level=logging.INFO)
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
