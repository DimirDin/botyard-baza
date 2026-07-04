from fastapi import APIRouter, Depends, HTTPException

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
        SELECT id, repo, name, category, description_ru, badge, stars,
               (stars - stars_prev) AS trending_delta, last_commit, archived
        FROM baza.tools
        WHERE published = true {"AND category = $1" if category else ""}
        ORDER BY {order_by}
    """
    rows = await pool.fetch(query, category) if category else await pool.fetch(query)
    return [dict(r) for r in rows]


@router.get("/{repo_slug}")
async def tool_detail(repo_slug: str):
    # repo_slug = "owner__name" (repo с "/" заменённым на "__") — используется и для API, и для фронтовых URL
    pool = get_pool()
    row = await pool.fetchrow(
        """
        SELECT id, repo, name, category, description_ru, body_md, badge, stars,
               (stars - stars_prev) AS trending_delta, last_commit, archived
        FROM baza.tools
        WHERE published = true AND replace(repo, '/', '__') = $1
        """,
        repo_slug,
    )
    if not row:
        raise HTTPException(404, "Инструмент не найден")
    return dict(row)
