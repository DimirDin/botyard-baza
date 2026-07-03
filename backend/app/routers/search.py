from fastapi import APIRouter, Depends

from app.db import get_pool
from app.deps import require_subscribed

router = APIRouter(prefix="/api/search", tags=["search"], dependencies=[Depends(require_subscribed)])


@router.get("")
async def search(q: str):
    pool = get_pool()
    entries = await pool.fetch(
        "SELECT slug, title, summary FROM baza.entries "
        "WHERE published AND (title ILIKE $1 OR summary ILIKE $1) LIMIT 10",
        f"%{q}%",
    )
    tools = await pool.fetch(
        "SELECT repo, name, description_ru FROM baza.tools "
        "WHERE published AND (name ILIKE $1 OR description_ru ILIKE $1) LIMIT 10",
        f"%{q}%",
    )
    prompts = await pool.fetch(
        "SELECT slug, title FROM baza.prompts "
        "WHERE published AND (title ILIKE $1 OR body ILIKE $1) LIMIT 10",
        f"%{q}%",
    )
    return {
        "entries": [{**dict(r), "type": "entry"} for r in entries],
        "tools": [{**dict(r), "type": "tool"} for r in tools],
        "prompts": [{**dict(r), "type": "prompt"} for r in prompts],
    }
