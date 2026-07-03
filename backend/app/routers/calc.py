import tiktoken
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.db import get_redis
from app.deps import require_subscribed

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

NEWER_TOKENIZER_MODELS = {"claude-fable-5", "claude-mythos-5"}


class CalcRequest(BaseModel):
    text: str
    model: str = "claude-sonnet-5"


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

    return {
        "tokens": tokens,
        "approx": True,
        "tokenizer_note": (
            "Оценка через tiktoken (cl100k_base) — не официальный токенайзер Claude, "
            "реальное число токенов может отличаться, особенно на кириллице."
        ),
        "cost_estimate_usd": round(tokens / 1_000_000 * pricing["input"], 6),
        "model_tokenizer_note": (
            "Модели Fable 5 / Mythos 5 используют новый токенайзер — тот же текст "
            "даёт заметно больше токенов, чем на моделях до Opus 4.7."
            if req.model in NEWER_TOKENIZER_MODELS else None
        ),
    }
