from fastapi import APIRouter, Depends

from app.db import get_pool
from app.deps import require_subscribed

router = APIRouter(prefix="/api/tools", tags=["tools"], dependencies=[Depends(require_subscribed)])

SORT_MAP = {
    "stars": "stars DESC",
    "trending": "(stars - stars_prev) DESC",
    "new": "added_at DESC",
}


@router.get("")
async def list_tools(category: str | None = None, sort: str = "stars"):
    pool = get_pool()
    order_by = SORT_MAP.get(sort, SORT_MAP["stars"])
    # published=true выставляется только после github-синка (см. tools.yaml verify_status)
    query = f"""
        SELECT repo, name, category, description_ru, badge, stars,
               (stars - stars_prev) AS trending_delta, last_commit, archived
        FROM baza.tools
        WHERE published = true {"AND category = $1" if category else ""}
        ORDER BY {order_by}
    """
    rows = await pool.fetch(query, category) if category else await pool.fetch(query)
    return [dict(r) for r in rows]
