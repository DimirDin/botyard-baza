import asyncio
import logging
import os

from aiogram import Bot, Dispatcher
from aiogram.filters import CommandStart
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, Message
from aiogram.utils.deep_linking import decode_payload

BOT_TOKEN = os.environ["BOT_TOKEN"]
MINI_APP_URL = os.environ.get("MINI_APP_URL", "https://baza.botyard.site")
CHANNEL_USERNAME = os.environ.get("CHANNEL_USERNAME", "@claudedry")

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()


@dp.message(CommandStart())
async def start(message: Message):
    payload = None
    parts = message.text.split(maxsplit=1)
    if len(parts) > 1:
        try:
            payload = decode_payload(parts[1])
        except Exception:
            payload = None

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


async def main():
    logging.basicConfig(level=logging.INFO)
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
