import json
import logging
import urllib.error
import urllib.request

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.config import settings
from app.db import get_redis
from app.deps import require_subscribed

router = APIRouter(prefix="/api/feedback", tags=["feedback"], dependencies=[Depends(require_subscribed)])

FEEDBACK_RATE_LIMIT = 3  # сообщений
FEEDBACK_RATE_WINDOW = 60 * 10  # за 10 минут на tg_id — защита TECH_CHAT_ID от спама


class FeedbackIn(BaseModel):
    text: str


@router.post("")
async def send_feedback(body: FeedbackIn, user: dict = Depends(require_subscribed)):
    text = body.text.strip()
    if not text:
        raise HTTPException(400, "Пустой текст")
    if len(text) > 2000:
        raise HTTPException(400, "Слишком длинный текст (максимум 2000 символов)")

    r = get_redis()
    rl_key = f"baza:feedback_rl:{user['tg_id']}"
    current = await r.incr(rl_key)
    if current == 1:
        await r.expire(rl_key, FEEDBACK_RATE_WINDOW)
    if current > FEEDBACK_RATE_LIMIT:
        raise HTTPException(429, "Слишком много сообщений, попробуй позже")

    who = f"@{user['username']}" if user.get("username") else f"tg_id {user['tg_id']}"
    message = f"📩 Новое предложение от {who} (tg_id {user['tg_id']}):\n\n{text}"

    recipients = feedback_recipients()
    if not recipients:
        # Раньше здесь был ответ 200 {"sent": false}, а фронт по 200 рисовал «Отправлено» —
        # человек думал, что предложение ушло, хотя оно осталось только в логе.
        logging.warning("TECH_CHAT_ID и ADMIN_TG_IDS не заданы, фидбэк не отправлен: %s", message)
        raise HTTPException(503, "Приём предложений временно не настроен")

    delivered = 0
    for chat_id in recipients:
        req = urllib.request.Request(
            f"https://api.telegram.org/bot{settings.bot_token}/sendMessage",
            data=json.dumps({"chat_id": chat_id, "text": message}).encode(),
            headers={"Content-Type": "application/json"},
        )
        try:
            with urllib.request.urlopen(req, timeout=10):
                delivered += 1
        except urllib.error.HTTPError as e:
            logging.error("Не удалось отправить фидбэк в %s: %s", chat_id, e.read())
        except (urllib.error.URLError, TimeoutError):
            logging.exception("Не удалось отправить фидбэк в %s", chat_id)

    if not delivered:
        raise HTTPException(502, "Не удалось отправить сообщение")
    return {"sent": True}


def feedback_recipients() -> list[str]:
    """Технический чат, а пока владелец его не завёл — админы из ADMIN_TG_IDS.
    Та же логика, что у бота (bot/main.py: feedback_recipients)."""
    if settings.tech_chat_id.strip():
        return [settings.tech_chat_id.strip()]
    return [str(i) for i in sorted(settings.admin_ids)]
