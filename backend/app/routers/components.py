from fastapi import APIRouter, Depends

from app.db import get_pool
from app.deps import require_subscribed

router = APIRouter(prefix="/api/components", tags=["components"], dependencies=[Depends(require_subscribed)])


@router.get("")
async def list_components(q: str | None = None):
    pool = get_pool()
    if q:
        rows = await pool.fetch(
            "SELECT slug, comp_type, category, name, title, summary, install_cmd, doc_url "
            "FROM baza.cc_components "
            "WHERE published AND search_tsv @@ plainto_tsquery('russian', $1) "
            "ORDER BY comp_type, sort_order",
            q,
        )
    else:
        rows = await pool.fetch(
            "SELECT slug, comp_type, category, name, title, summary, install_cmd, doc_url "
            "FROM baza.cc_components WHERE published ORDER BY comp_type, sort_order"
        )
    return [dict(r) for r in rows]
