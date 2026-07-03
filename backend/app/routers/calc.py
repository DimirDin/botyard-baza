import anthropic
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.config import settings
from app.db import get_redis
from app.deps import require_subscribed

router = APIRouter(prefix="/api/calc", tags=["calc"], dependencies=[Depends(require_subscribed)])

client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

# Fable 5 / Mythos 5 используют токенайзер Opus 4.7+ — на том же тексте выходит
# заметно больше токенов, чем на моделях до Opus 4.7. См. cheat-api-limits-models.
NEWER_TOKENIZER_MODELS = {"claude-fable-5", "claude-mythos-5"}


class CalcRequest(BaseModel):
    text: str
    model: str = "claude-sonnet-5"
    compare_en: bool = False


@router.post("/tokens")
async def calc_tokens(req: CalcRequest, user: dict = Depends(require_subscribed)):
    r = get_redis()
    tg_id = user["tg_id"]

    # count_tokens бесплатный, но общий лимит один на весь бот — мягкий cap на пользователя
    count_key = f"baza:calc_rl:{tg_id}"
    current = await r.incr(count_key)
    if current == 1:
        await r.expire(count_key, 60)
    if current > 30:
        raise HTTPException(429, "Слишком много запросов на подсчёт, подожди минуту")

    ru_tokens = _count_tokens(req.text, req.model)
    result = {
        "ru_tokens": ru_tokens,
        "tokenizer_note": (
            "Модели Fable 5 / Mythos 5 используют новый токенайзер — тот же текст "
            "даёт заметно больше токенов, чем на моделях до Opus 4.7."
            if req.model in NEWER_TOKENIZER_MODELS else None
        ),
    }

    if req.compare_en:
        # Платный шаг — жёсткий дневной лимит, отдельный от live-счётчика
        daily_key = f"baza:calc_en_daily:{tg_id}"
        daily_count = await r.incr(daily_key)
        if daily_count == 1:
            await r.expire(daily_key, 86400)
        if daily_count > 20:
            raise HTTPException(429, "Дневной лимит сравнения с английским исчерпан")

        translation = _translate_to_en(req.text)
        en_tokens = _count_tokens(translation, req.model)
        savings_pct = round((1 - en_tokens / ru_tokens) * 100, 1) if ru_tokens else 0
        result.update({
            "en_tokens": en_tokens,
            "savings_pct": savings_pct,
            "translation_note": "Перевод приблизительный, только для оценки токенов",
        })

    return result


def _count_tokens(text: str, model: str) -> int:
    resp = client.messages.count_tokens(
        model=model,
        messages=[{"role": "user", "content": text}],
    )
    return resp.input_tokens


def _translate_to_en(text: str) -> str:
    """Дешёвый перевод через Haiku 4.5 — только для оценки, не для показа пользователю как готовый перевод."""
    resp = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=len(text) * 2 + 100,
        messages=[{"role": "user", "content": f"Translate to English, output only the translation:\n\n{text}"}],
    )
    return resp.content[0].text
