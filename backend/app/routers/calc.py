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
# Загружается лениво и один раз. Раньше вызов стоял на уровне модуля, то есть
# tiktoken тянул BPE-словарь по сети в момент ИМПОРТА: холодный старт контейнера
# (и сбор тестов) зависел от доступности стороннего URL, а падение выглядело как
# неспособность импортировать app.routers.calc. Теперь сеть нужна только при
# первом обращении к калькулятору, и её отказ не роняет остальное приложение.
_ENCODING = None


def _encoding():
    global _ENCODING
    if _ENCODING is None:
        _ENCODING = tiktoken.get_encoding("cl100k_base")
    return _ENCODING

# Цены за 1M токенов (input/output), сверено с content/cheatsheets/api-limits-and-models.md
# (сверка 17.10.2026 по platform.claude.com/docs/en/about-claude/pricing).
# ВНИМАНИЕ: у Sonnet 5 цена $2/$10 — это ОБЫЧНЫЙ тариф, а не промо. Анонсированный
# подъём до $3/$15 с 01.09.2026 отменён Anthropic и не состоялся. Ранее здесь стояло
# $3/$15, из-за чего калькулятор завышал стоимость дефолтной модели в полтора раза.
# Партия 5.5 (Sonnet 5.5 — 28.09, Opus 5.5 — 22.09, Haiku 5.5 — 07.10.2026) не была
# заведена до 17.10: калькулятор месяц предлагал только прошлое поколение.
MODEL_PRICING = {
    "claude-fable-5-1": {"input": 10.00, "output": 50.00},
    "claude-opus-5-5": {"input": 4.00, "output": 20.00},
    "claude-sonnet-5-5": {"input": 2.00, "output": 10.00},
    "claude-haiku-5-5": {"input": 0.10, "output": 0.50},
    "claude-opus-5": {"input": 5.00, "output": 25.00},
    "claude-sonnet-5": {"input": 2.00, "output": 10.00},
    "claude-haiku-4-5": {"input": 1.00, "output": 5.00},
}

DEFAULT_MODEL = "claude-sonnet-5-5"

# Haiku 5.5 — единственная модель с ценой, зависящей от длины промпта: запрос, чей
# вход (включая кэш-чтения и кэш-записи) больше 100k токенов, целиком платит по
# старшей ступени. Остальные модели 4.6+ берут единую цену на всё окно в 1M.
LONG_PROMPT_PRICING = {
    "claude-haiku-5-5": {"threshold": 100_000, "input": 0.50, "output": 2.50},
}

# Размер контекстного окна, токенов — сверено с content/cheatsheets/api-limits-and-models.md
CONTEXT_WINDOW = {
    "claude-fable-5-1": 1_000_000,
    "claude-opus-5-5": 1_000_000,
    "claude-sonnet-5-5": 1_000_000,
    "claude-haiku-5-5": 1_000_000,
    "claude-opus-5": 1_000_000,
    "claude-sonnet-5": 1_000_000,
    "claude-haiku-4-5": 200_000,
}

# Новый токенайзер — у ВСЕХ моделей 4.7 и новее (не только Fable/Mythos, как считалось
# раньше): тот же текст даёт ~30% больше токенов. Sonnet 4.6 и старше — прежний токенайзер.
# Список веду по признаку, а не по остатку: модели здесь могут отсутствовать в дропдауне.
NEWER_TOKENIZER_MODELS = {
    "claude-fable-5-1",
    "claude-fable-5",
    "claude-mythos-5-1",
    "claude-mythos-5",
    "claude-opus-5-5",
    "claude-sonnet-5-5",
    "claude-haiku-5-5",
    "claude-opus-5",
    "claude-sonnet-5",
    "claude-opus-4-8",
    "claude-opus-4-7",
}

TRANSLATE_CACHE_TTL = 60 * 60 * 24  # 24ч

# Чтение из prompt cache — доля от базовой цены input. Обычно 0.1×, но у части моделей
# хит дешевле: 0.05× у Opus 5.5 и Sonnet 5.5, 0.025× у Fable 5.1 и Mythos 5.1
# (сверено с таблицей «Prompt Caching» в api-limits-and-models.md). Раньше здесь стояла
# одна общая скидка 90% — для новых моделей она бы занижала выгоду кэша вдвое.
CACHE_READ_MULTIPLIER_DEFAULT = 0.1
CACHE_READ_MULTIPLIER = {
    "claude-fable-5-1": 0.025,
    "claude-mythos-5-1": 0.025,
    "claude-opus-5-5": 0.05,
    "claude-sonnet-5-5": 0.05,
}

# Batch API — скидка 50% на вход и выход, зафиксирована прямо в
# content/cheatsheets/api-limits-and-models.md («Batch API: скидка 50% на вход и выход»).
BATCH_DISCOUNT = 0.5


def input_pricing(model: str, prompt_tokens: int) -> dict:
    """Цена за 1M токенов с учётом ступени по длине промпта (сейчас она только у Haiku 5.5)."""
    tier = LONG_PROMPT_PRICING.get(model)
    if tier and prompt_tokens > tier["threshold"]:
        return {"input": tier["input"], "output": tier["output"], "long_prompt": True}
    return {**MODEL_PRICING[model], "long_prompt": False}


def cache_read_multiplier(model: str) -> float:
    return CACHE_READ_MULTIPLIER.get(model, CACHE_READ_MULTIPLIER_DEFAULT)


class CalcRequest(BaseModel):
    text: str
    model: str = DEFAULT_MODEL


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

    tokens = len(_encoding().encode(req.text))
    model = req.model if req.model in MODEL_PRICING else DEFAULT_MODEL
    pricing = input_pricing(model, tokens)
    context_window = CONTEXT_WINDOW[model]
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
            en_tokens = len(_encoding().encode(translated))
            en_context_pct = round(en_tokens / context_window * 100, 2)
            if en_tokens > 0:
                ru_vs_en_delta_pct = round((tokens - en_tokens) / en_tokens * 100)

    price_standard = round(tokens / 1_000_000 * pricing["input"], 6)
    price_with_caching = round(price_standard * cache_read_multiplier(model), 6)
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
        "cache_read_multiplier": cache_read_multiplier(model),
        "price_with_batch": price_with_batch,
        "model_tokenizer_note": (
            "Эта модель использует новый токенайзер (все модели 4.7 и новее): тот же "
            "текст даёт примерно на 30% больше токенов, чем на Sonnet 4.6 и более старых. "
            "Оценка ниже посчитана прежним BPE и для этой модели скорее занижена."
            if model in NEWER_TOKENIZER_MODELS else None
        ),
        "long_prompt_note": (
            f"Промпт длиннее {LONG_PROMPT_PRICING[model]['threshold'] // 1000}k токенов: "
            "у этой модели весь запрос тарифицируется по старшей ступени цены."
            if pricing["long_prompt"] else None
        ),
        "context_window": context_window,
        "ru_context_pct": ru_context_pct,
        "en_tokens": en_tokens,
        "en_context_pct": en_context_pct,
        "ru_vs_en_delta_pct": ru_vs_en_delta_pct,
    }
