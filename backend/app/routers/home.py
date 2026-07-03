from fastapi import APIRouter, Depends

from app.db import get_pool
from app.deps import require_subscribed

router = APIRouter(prefix="/api/home", tags=["home"], dependencies=[Depends(require_subscribed)])


@router.get("")
async def home():
    pool = get_pool()
    counts = await pool.fetchrow(
        """
        SELECT
            (SELECT count(*) FROM baza.entries WHERE published) AS entries_count,
            (SELECT count(*) FROM baza.tools WHERE published) AS tools_count,
            (SELECT count(*) FROM baza.prompts WHERE published) AS prompts_count
        """
    )
    top_prompts = await pool.fetch(
        "SELECT slug, title, copies_count FROM baza.prompts WHERE published ORDER BY copies_count DESC LIMIT 3"
    )
    recent_entries = await pool.fetch(
        "SELECT slug, title, updated_at FROM baza.entries WHERE published ORDER BY updated_at DESC LIMIT 5"
    )
    return {
        "counts": dict(counts),
        "top_prompts": [dict(r) for r in top_prompts],
        "recent_entries": [dict(r) for r in recent_entries],
    }
