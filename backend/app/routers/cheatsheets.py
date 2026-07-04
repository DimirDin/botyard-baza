from fastapi import APIRouter, Depends, HTTPException

from app.db import get_pool
from app.deps import require_subscribed

router = APIRouter(prefix="/api/cheatsheets", tags=["cheatsheets"], dependencies=[Depends(require_subscribed)])


@router.get("")
async def list_cheatsheets():
    pool = get_pool()
    rows = await pool.fetch(
        "SELECT slug, title, category, sort_order FROM baza.cheatsheets "
        "WHERE published ORDER BY sort_order, title"
    )
    return [dict(r) for r in rows]


@router.get("/{slug}")
async def get_cheatsheet(slug: str):
    pool = get_pool()
    row = await pool.fetchrow(
        "SELECT slug, title, category, body_md FROM baza.cheatsheets WHERE slug = $1 AND published",
        slug,
    )
    if not row:
        raise HTTPException(404, "Шпаргалка не найдена")
    return dict(row)
