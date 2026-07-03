from fastapi import APIRouter, Depends, HTTPException

from app.db import get_pool
from app.deps import require_subscribed

router = APIRouter(prefix="/api/entries", tags=["entries"], dependencies=[Depends(require_subscribed)])


@router.get("")
async def list_entries(section: str | None = None):
    pool = get_pool()
    if section:
        rows = await pool.fetch(
            "SELECT slug, section, title, summary, tags, sort_order, updated_at "
            "FROM baza.entries WHERE published AND section = $1 ORDER BY sort_order",
            section,
        )
    else:
        rows = await pool.fetch(
            "SELECT slug, section, title, summary, tags, sort_order, updated_at "
            "FROM baza.entries WHERE published ORDER BY section, sort_order"
        )
    return [dict(r) for r in rows]


@router.get("/{slug}")
async def get_entry(slug: str):
    pool = get_pool()
    row = await pool.fetchrow(
        "SELECT slug, section, title, summary, body_md, doc_url, tags, updated_at "
        "FROM baza.entries WHERE slug = $1 AND published",
        slug,
    )
    if not row:
        raise HTTPException(404, "Статья не найдена")
    return dict(row)
