"""
Гейт по подписке на @claudedry — см. §5 PROJECT_CONTEXT.

Поток:
1. Валидация initData (HMAC-SHA256, свежесть auth_date < 1ч)
2. Redis-кэш wiki:sub:{tg_id} → baza:sub:{tg_id}
   - hit subscribed → пускаем (TTL 6ч)
   - hit not_subscribed → гейт (TTL 60с — короткий, чтобы не ждать после подписки)
   - miss → getChatMember → записать в кэш
3. Деградация: сбой Telegram API → берём последний известный статус из PG, не блокируем
"""
import hashlib
import hmac
import json
import time
from urllib.parse import parse_qsl

import httpx
from fastapi import HTTPException

from app.config import settings
from app.db import get_pool, get_redis

TELEGRAM_API = "https://api.telegram.org/bot{token}/getChatMember"


def validate_init_data(init_data: str) -> dict:
    """Проверяет подпись Telegram WebApp initData, возвращает распарсенные поля."""
    parsed = dict(parse_qsl(init_data))
    received_hash = parsed.pop("hash", None)
    if not received_hash:
        raise HTTPException(401, "initData: missing hash")

    data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(parsed.items()))
    secret_key = hmac.new(b"WebAppData", settings.bot_token.encode(), hashlib.sha256).digest()
    computed_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

    if not hmac.compare_digest(computed_hash, received_hash):
        raise HTTPException(401, "initData: invalid signature")

    auth_date = int(parsed.get("auth_date", 0))
    if time.time() - auth_date > 3600:
        raise HTTPException(401, "initData: expired (>1h)")

    user = json.loads(parsed["user"]) if "user" in parsed else {}
    return {"tg_id": user.get("id"), "username": user.get("username"), "raw": parsed}


async def check_subscription(tg_id: int, force: bool = False) -> bool:
    """Возвращает True если пользователь подписан на канал. Кэширует в Redis + PG."""
    r = get_redis()
    cache_key = f"baza:sub:{tg_id}"

    if not force:
        cached = await r.get(cache_key)
        if cached is not None:
            return cached == "1"

    is_subscribed = await _fetch_subscription_status(tg_id)
    ttl = settings.gate_ttl_subscribed if is_subscribed else settings.gate_ttl_not_subscribed
    await r.set(cache_key, "1" if is_subscribed else "0", ex=ttl)

    pool = get_pool()
    await pool.execute(
        """
        INSERT INTO baza.users (tg_id, is_subscribed, sub_checked_at, last_seen)
        VALUES ($1, $2, now(), now())
        ON CONFLICT (tg_id) DO UPDATE
        SET is_subscribed = $2, sub_checked_at = now(), last_seen = now()
        """,
        tg_id, is_subscribed,
    )
    return is_subscribed


async def _fetch_subscription_status(tg_id: int) -> bool:
    """Дёргает getChatMember. При сбое Telegram API — деградация на последний статус из PG."""
    url = TELEGRAM_API.format(token=settings.bot_token)
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url, params={"chat_id": settings.channel_username, "user_id": tg_id})
            data = resp.json()
        if not data.get("ok"):
            return await _fallback_from_pg(tg_id)
        status = data["result"]["status"]
        return status in ("member", "administrator", "creator")
    except (httpx.HTTPError, KeyError, ValueError):
        return await _fallback_from_pg(tg_id)


async def _fallback_from_pg(tg_id: int) -> bool:
    """Никогда не блокируем уже подписанных из-за сбоя API — берём последний известный статус."""
    pool = get_pool()
    row = await pool.fetchrow("SELECT is_subscribed FROM baza.users WHERE tg_id = $1", tg_id)
    return bool(row["is_subscribed"]) if row else False


async def rate_limit_recheck(tg_id: int) -> None:
    """1 запрос / N сек на кнопку 'Проверить подписку' — см. §5."""
    r = get_redis()
    key = f"baza:recheck_rl:{tg_id}"
    if await r.get(key):
        raise HTTPException(429, "Слишком часто — попробуй через несколько секунд")
    await r.set(key, "1", ex=settings.gate_recheck_rate_limit_sec)
