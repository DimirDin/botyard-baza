import json
import logging
import urllib.error
import urllib.request

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.config import settings
from app.deps import require_subscribed

router = APIRouter(prefix="/api/feedback", tags=["feedback"], dependencies=[Depends(require_subscribed)])


class FeedbackIn(BaseModel):
    text: str


@router.post("")
async def send_feedback(body: FeedbackIn, user: dict = Depends(require_subscribed)):
    text = body.text.strip()
    if not text:
        raise HTTPException(400, "Пустой текст")
    if len(text) > 2000:
        raise HTTPException(400, "Слишком длинный текст (максимум 2000 символов)")

    who = f"@{user['username']}" if user.get("username") else f"tg_id {user['tg_id']}"
    message = f"📩 Новое предложение от {who} (tg_id {user['tg_id']}):\n\n{text}"

    if not settings.tech_chat_id:
        logging.warning("TECH_CHAT_ID не задан, фидбэк не отправлен: %s", message)
        return {"sent": False}

    req = urllib.request.Request(
        f"https://api.telegram.org/bot{settings.bot_token}/sendMessage",
        data=json.dumps({"chat_id": settings.tech_chat_id, "text": message}).encode(),
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=10):
            pass
    except urllib.error.HTTPError as e:
        logging.error("Не удалось отправить фидбэк в TECH_CHAT_ID: %s", e.read())
        raise HTTPException(502, "Не удалось отправить сообщение") from e

    return {"sent": True}
