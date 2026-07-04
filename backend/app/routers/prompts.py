from fastapi import APIRouter, Depends, HTTPException

from app.db import get_pool
from app.deps import require_subscribed

router = APIRouter(prefix="/api/prompts", tags=["prompts"], dependencies=[Depends(require_subscribed)])


@router.get("")
async def list_prompts(category: str | None = None):
    pool = get_pool()
    if category:
        rows = await pool.fetch(
            "SELECT id, slug, category, title, body, comment, copies_count "
            "FROM baza.prompts WHERE published AND category = $1 ORDER BY copies_count DESC",
            category,
        )
    else:
        rows = await pool.fetch(
            "SELECT id, slug, category, title, body, comment, copies_count "
            "FROM baza.prompts WHERE published ORDER BY copies_count DESC"
        )
    return [dict(r) for r in rows]


@router.post("/{slug}/copy")
async def copy_prompt(slug: str):
    pool = get_pool()
    row = await pool.fetchrow(
        "UPDATE baza.prompts SET copies_count = copies_count + 1 WHERE slug = $1 RETURNING copies_count",
        slug,
    )
    if not row:
        raise HTTPException(404, "Промпт не найден")
    return {"copies_count": row["copies_count"]}
