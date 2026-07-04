"""
Синк числа подписчиков канала @claudedry в Redis — раз в час, cron (см. deploy/README.md).

Не дёргаем getChatMemberCount синхронно в обработчике /api/home — это лишний round-trip
к Telegram Bot API на каждый заход пользователя в Mini App, счётчик подписчиков не обязан
быть secondly-точным. Вместо этого — читаем значение из Redis, обновляемое здесь.

Запуск: BOT_TOKEN=... REDIS_URL=redis://... python scripts/sync_subscribers_count.py
Расписание: /etc/cron.d/botyard-baza-subscribers, раз в час.
"""
import json
import os
import urllib.error
import urllib.request

import redis

BOT_TOKEN = os.environ["BOT_TOKEN"]
CHANNEL_USERNAME = os.environ.get("CHANNEL_USERNAME", "@claudedry")
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
REDIS_KEY = "baza:stats:subscribers"


def fetch_member_count() -> int:
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/getChatMemberCount?chat_id={CHANNEL_USERNAME}"
    with urllib.request.urlopen(url, timeout=15) as resp:
        data = json.load(resp)
    if not data.get("ok"):
        raise RuntimeError(f"Telegram API error: {data}")
    return data["result"]


def main() -> None:
    count = fetch_member_count()
    r = redis.from_url(REDIS_URL, decode_responses=True)
    # Без TTL — значение просто перезаписывается каждым прогоном cron (раз в час).
    r.set(REDIS_KEY, count)
    print(f"✓ подписчиков {CHANNEL_USERNAME}: {count} → {REDIS_KEY}")


if __name__ == "__main__":
    main()
