from fastapi import APIRouter, Depends, HTTPException

from app.db import get_pool
from app.deps import require_subscribed

router = APIRouter(prefix="/api/news", tags=["news"], dependencies=[Depends(require_subscribed)])


@router.get("")
async def list_news():
    pool = get_pool()
    rows = await pool.fetch(
        "SELECT slug, title, summary, doc_url, published_at FROM baza.news "
        "WHERE published ORDER BY published_at DESC"
    )
    return [dict(r) for r in rows]


@router.get("/{slug}")
async def get_news_item(slug: str):
    pool = get_pool()
    row = await pool.fetchrow(
        "SELECT slug, title, summary, body_md, doc_url, published_at FROM baza.news "
        "WHERE slug = $1 AND published",
        slug,
    )
    if not row:
        raise HTTPException(404, "Новость не найдена")
    return dict(row)
