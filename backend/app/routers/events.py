from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.db import get_pool, get_redis
from app.deps import require_subscribed

router = APIRouter(prefix="/api/events", tags=["events"], dependencies=[Depends(require_subscribed)])


class Event(BaseModel):
    event: str
    payload: dict = {}


class EventBatch(BaseModel):
    events: list[Event]


@router.post("")
async def log_events(batch: EventBatch, user: dict = Depends(require_subscribed)):
    if not batch.events:
        return {"logged": 0}

    r = get_redis()
    rl_key = f"baza:events_rl:{user['tg_id']}"
    val = await r.incr(rl_key, amount=len(batch.events))
    if val == len(batch.events):
        await r.expire(rl_key, 60)
    if val > 30:
        raise HTTPException(429, "Too many events. Please rate limit telemetry collection.")

    pool = get_pool()
    async with pool.acquire() as conn:
        await conn.executemany(
            "INSERT INTO baza.events (tg_id, event, payload) VALUES ($1, $2, $3)",
            [(user["tg_id"], e.event, e.payload) for e in batch.events],
        )
    return {"logged": len(batch.events)}
