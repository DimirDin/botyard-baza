from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.db import get_pool
from app.deps import require_subscribed

router = APIRouter(prefix="/api/favorites", tags=["favorites"], dependencies=[Depends(require_subscribed)])


class FavoriteToggle(BaseModel):
    item_type: str  # entry | tool | prompt | guide
    item_id: int


@router.get("")
async def list_favorites(user: dict = Depends(require_subscribed)):
    """Избранное с данными для рендера карточек — фронту недостаточно голых item_id."""
    pool = get_pool()
    rows = await pool.fetch(
        """
        SELECT f.item_type, f.item_id, f.created_at,
               COALESCE(e.title, t.name, p.title, g.title) AS title,
               COALESCE(e.summary, t.description_ru, p.comment, g.summary) AS subtitle,
               e.slug AS entry_slug, p.slug AS prompt_slug, t.repo AS tool_repo,
               g.slug AS guide_slug, g.level AS guide_level
        FROM baza.favorites f
        LEFT JOIN baza.entries e ON f.item_type = 'entry' AND e.id = f.item_id AND e.published
        LEFT JOIN baza.tools t ON f.item_type = 'tool' AND t.id = f.item_id AND t.published
        LEFT JOIN baza.prompts p ON f.item_type = 'prompt' AND p.id = f.item_id AND p.published
        LEFT JOIN baza.guide_lessons g ON f.item_type = 'guide' AND g.id = f.item_id AND g.published
        WHERE f.tg_id = $1
          AND COALESCE(e.id, t.id, p.id, g.id) IS NOT NULL  -- скрываем снятое с публикации
        ORDER BY f.created_at DESC
        """,
        user["tg_id"],
    )
    return [dict(r) for r in rows]


@router.get("/ids")
async def favorite_ids(user: dict = Depends(require_subscribed)):
    """Компактный набор ключей item_type:item_id — для отрисовки звёздочек в списках."""
    pool = get_pool()
    rows = await pool.fetch(
        "SELECT item_type, item_id FROM baza.favorites WHERE tg_id = $1", user["tg_id"],
    )
    return [f"{r['item_type']}:{r['item_id']}" for r in rows]


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
