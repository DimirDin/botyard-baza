from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.db import get_pool
from app.deps import require_subscribed

router = APIRouter(prefix="/api/favorites", tags=["favorites"], dependencies=[Depends(require_subscribed)])


class FavoriteToggle(BaseModel):
    item_type: str  # entry | tool | prompt
    item_id: int


@router.get("")
async def list_favorites(user: dict = Depends(require_subscribed)):
    pool = get_pool()
    rows = await pool.fetch(
        "SELECT item_type, item_id, created_at FROM baza.favorites WHERE tg_id = $1 ORDER BY created_at DESC",
        user["tg_id"],
    )
    return [dict(r) for r in rows]


@router.post("/toggle")
async def toggle_favorite(body: FavoriteToggle, user: dict = Depends(require_subscribed)):
    pool = get_pool()
    existing = await pool.fetchrow(
        "SELECT 1 FROM baza.favorites WHERE tg_id=$1 AND item_type=$2 AND item_id=$3",
        user["tg_id"], body.item_type, body.item_id,
    )
    if existing:
        await pool.execute(
            "DELETE FROM baza.favorites WHERE tg_id=$1 AND item_type=$2 AND item_id=$3",
            user["tg_id"], body.item_type, body.item_id,
        )
        return {"favorited": False}
    await pool.execute(
        "INSERT INTO baza.favorites (tg_id, item_type, item_id) VALUES ($1, $2, $3)",
        user["tg_id"], body.item_type, body.item_id,
    )
    return {"favorited": True}
