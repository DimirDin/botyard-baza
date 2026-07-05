import hashlib
import logging

import tiktoken
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.db import get_redis
from app.deps import require_subscribed
from app.services.translate import translate_ru_to_en

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/calc", tags=["calc"], dependencies=[Depends(require_subscribed)])

# Нет ключа Anthropic → официальный count_tokens недоступен (он тоже требует
# авторизацию, даже будучи бесплатным по деньгам). Считаем локально через
# tiktoken (cl100k_base) как приближение — не настоящий токенайзер Claude,
# особенно расходится на кириллице (см. §13 PROJECT_CONTEXT).
_ENCODING = tiktoken.get_encoding("cl100k_base")

# Цены за 1M токенов (input/output), сверено с content/cheatsheets/api-limits-and-models.md
MODEL_PRICING = {
    "claude-fable-5": {"input": 10.00, "output": 50.00},
    "claude-opus-4-8": {"input": 5.00, "output": 25.00},
    "claude-sonnet-5": {"input": 3.00, "output": 15.00},
    "claude-haiku-4-5": {"input": 1.00, "output": 5.00},
}

# Размер контекстного окна, токенов — сверено с content/cheatsheets/api-limits-and-models.md
CONTEXT_WINDOW = {
    "claude-fable-5": 1_000_000,
    "claude-opus-4-8": 1_000_000,
    "claude-sonnet-5": 1_000_000,
    "claude-haiku-4-5": 200_000,
}

NEWER_TOKENIZER_MODELS = {"claude-fable-5", "claude-mythos-5"}

TRANSLATE_CACHE_TTL = 60 * 60 * 24  # 24ч

# Скидка на input-токены при чтении из prompt cache. content/cheatsheets/api-limits-and-models.md
# фиксирует только TTL кэша (~5 мин), без числа скидки — 90% (т.е. кэш-чтение стоит 10% от базовой
# цены) взято из публичной документации Anthropic по prompt caching (platform.claude.com/docs),
# сверить перед продом, если тарифы изменятся.
CACHE_DISCOUNT = 0.9

# Batch API — скидка 50% на вход и выход, зафиксирована прямо в
# content/cheatsheets/api-limits-and-models.md («Batch API: скидка 50% на вход и выход»).
BATCH_DISCOUNT = 0.5


class CalcRequest(BaseModel):
    text: str
    model: str = "claude-sonnet-5"


async def _translate_cached(r, text: str) -> str | None:
    cache_key = f"baza:translate:{hashlib.sha256(text.encode()).hexdigest()[:16]}"
    cached = await r.get(cache_key)
    if cached is not None:
        return cached or None  # пустая строка в кэше = «перевод недоступен», не бьём модель зря

    translated = translate_ru_to_en(text)
    await r.setex(cache_key, TRANSLATE_CACHE_TTL, translated or "")
    return translated


@router.post("/tokens")
async def calc_tokens(req: CalcRequest, user: dict = Depends(require_subscribed)):
    r = get_redis()
    tg_id = user["tg_id"]

    count_key = f"baza:calc_rl:{tg_id}"
    current = await r.incr(count_key)
    if current == 1:
        await r.expire(count_key, 60)
    if current > 30:
        raise HTTPException(429, "Слишком много запросов на подсчёт, подожди минуту")

    tokens = len(_ENCODING.encode(req.text))
    pricing = MODEL_PRICING.get(req.model, MODEL_PRICING["claude-sonnet-5"])
    context_window = CONTEXT_WINDOW.get(req.model, CONTEXT_WINDOW["claude-sonnet-5"])
    ru_context_pct = round(tokens / context_window * 100, 2)

    en_tokens = en_context_pct = ru_vs_en_delta_pct = None

    translate_key = f"baza:translate_rl:{tg_id}"
    translate_calls = await r.incr(translate_key)
    if translate_calls == 1:
        await r.expire(translate_key, 60)

    if translate_calls <= 10:
        try:
            translated = await _translate_cached(r, req.text)
        except Exception:
            translated = None
            logger.warning("перевод для калькулятора упал, EN-полоса скрыта", exc_info=True)

        if translated:
            en_tokens = len(_ENCODING.encode(translated))
            en_context_pct = round(en_tokens / context_window * 100, 2)
            if en_tokens > 0:
                ru_vs_en_delta_pct = round((tokens - en_tokens) / en_tokens * 100)

    price_standard = round(tokens / 1_000_000 * pricing["input"], 6)
    price_with_caching = round(price_standard * (1 - CACHE_DISCOUNT), 6)
    price_with_batch = round(price_standard * (1 - BATCH_DISCOUNT), 6)

    return {
        "tokens": tokens,
        "approx": True,
        "tokenizer_note": (
            "Оценка через tiktoken (cl100k_base) — не официальный токенайзер Claude, "
            "реальное число токенов может отличаться, особенно на кириллице."
        ),
        "cost_estimate_usd": price_standard,
        "price_standard": price_standard,
        "price_with_caching": price_with_caching,
        "price_with_batch": price_with_batch,
        "model_tokenizer_note": (
            "Модели Fable 5 / Mythos 5 используют новый токенайзер — тот же текст "
            "даёт заметно больше токенов, чем на моделях до Opus 4.7."
            if req.model in NEWER_TOKENIZER_MODELS else None
        ),
        "context_window": context_window,
        "ru_context_pct": ru_context_pct,
        "en_tokens": en_tokens,
        "en_context_pct": en_context_pct,
        "ru_vs_en_delta_pct": ru_vs_en_delta_pct,
    }
