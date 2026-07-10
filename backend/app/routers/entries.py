from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.db import get_pool
from app.deps import require_subscribed

router = APIRouter(prefix="/api/entries", tags=["entries"], dependencies=[Depends(require_subscribed)])


class RatingIn(BaseModel):
    value: int  # 1 (👍) | -1 (👎)


@router.get("")
async def list_entries(section: str | None = None, group: str | None = None):
    pool = get_pool()
    where = ["published"]
    params: list[str] = []
    if section:
        params.append(section)
        where.append(f"section = ${len(params)}")
    if group:
        params.append(group)
        where.append(f"group_slug = ${len(params)}")
    rows = await pool.fetch(
        "SELECT id, slug, section, group_slug, title, summary, tags, sort_order, updated_at "
        f"FROM baza.entries WHERE {' AND '.join(where)} ORDER BY section, sort_order",
        *params,
    )
    return [dict(r) for r in rows]


@router.get("/{slug}")
async def get_entry(slug: str, user: dict = Depends(require_subscribed)):
    pool = get_pool()
    row = await pool.fetchrow(
        """
        SELECT e.id, e.slug, e.section, e.title, e.summary, e.body_md, e.doc_url, e.tags, e.updated_at,
               COALESCE(SUM(r.value) FILTER (WHERE r.value = 1), 0) AS likes,
               COALESCE(-SUM(r.value) FILTER (WHERE r.value = -1), 0) AS dislikes,
               (SELECT value FROM baza.entry_ratings WHERE entry_id = e.id AND tg_id = $2) AS my_rating
        FROM baza.entries e
        LEFT JOIN baza.entry_ratings r ON r.entry_id = e.id
        WHERE e.slug = $1 AND e.published
        GROUP BY e.id
        """,
        slug, user["tg_id"],
    )
    if not row:
        raise HTTPException(404, "Статья не найдена")
    return dict(row)


@router.post("/{slug}/rate")
async def rate_entry(slug: str, body: RatingIn, user: dict = Depends(require_subscribed)):
    if body.value not in (1, -1):
        raise HTTPException(400, "value должен быть 1 или -1")
    pool = get_pool()
    entry = await pool.fetchrow("SELECT id FROM baza.entries WHERE slug = $1 AND published", slug)
    if not entry:
        raise HTTPException(404, "Статья не найдена")

    existing = await pool.fetchrow(
        "SELECT value FROM baza.entry_ratings WHERE tg_id = $1 AND entry_id = $2",
        user["tg_id"], entry["id"],
    )
    if existing and existing["value"] == body.value:
        # повторный тап тем же значением — снимаем оценку
        await pool.execute(
            "DELETE FROM baza.entry_ratings WHERE tg_id = $1 AND entry_id = $2",
            user["tg_id"], entry["id"],
        )
        my_rating = None
    else:
        await pool.execute(
            """
            INSERT INTO baza.entry_ratings (tg_id, entry_id, value) VALUES ($1, $2, $3)
            ON CONFLICT (tg_id, entry_id) DO UPDATE SET value = $3, rated_at = now()
            """,
            user["tg_id"], entry["id"], body.value,
        )
        my_rating = body.value

    counts = await pool.fetchrow(
        """
        SELECT COALESCE(SUM(value) FILTER (WHERE value = 1), 0) AS likes,
               COALESCE(-SUM(value) FILTER (WHERE value = -1), 0) AS dislikes
        FROM baza.entry_ratings WHERE entry_id = $1
        """,
        entry["id"],
    )
    return {"likes": counts["likes"], "dislikes": counts["dislikes"], "my_rating": my_rating}
