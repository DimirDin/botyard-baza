from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.db import get_pool
from app.deps import require_subscribed

router = APIRouter(prefix="/api/events", tags=["events"], dependencies=[Depends(require_subscribed)])


class Event(BaseModel):
    event: str
    payload: dict = {}


class EventBatch(BaseModel):
    events: list[Event]


@router.post("")
async def log_events(batch: EventBatch, user: dict = Depends(require_subscribed)):
    pool = get_pool()
    async with pool.acquire() as conn:
        await conn.executemany(
            "INSERT INTO baza.events (tg_id, event, payload) VALUES ($1, $2, $3)",
            [(user["tg_id"], e.event, e.payload) for e in batch.events],
        )
    return {"logged": len(batch.events)}
