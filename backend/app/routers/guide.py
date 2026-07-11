from fastapi import APIRouter, Depends, HTTPException

from app.db import get_pool
from app.deps import require_subscribed

router = APIRouter(prefix="/api/guide", tags=["guide"], dependencies=[Depends(require_subscribed)])


@router.get("/lessons")
async def list_lessons(user: dict = Depends(require_subscribed)):
    pool = get_pool()
    rows = await pool.fetch(
        """
        SELECT l.id, l.slug, l.level, l.title, l.summary, l.order_in_level,
               (gp.lesson_id IS NOT NULL) AS completed
        FROM baza.guide_lessons l
        LEFT JOIN baza.guide_progress gp ON gp.lesson_id = l.id AND gp.tg_id = $1
        WHERE l.published
        ORDER BY l.level, l.order_in_level
        """,
        user["tg_id"],
    )
    return [dict(r) for r in rows]


@router.get("/lessons/{slug}")
async def get_lesson(slug: str, user: dict = Depends(require_subscribed)):
    pool = get_pool()
    row = await pool.fetchrow(
        """
        SELECT l.id, l.slug, l.level, l.title, l.summary, l.body_md, l.doc_url, l.order_in_level,
               l.related_entry, l.related_tools, l.related_prompts,
               (gp.lesson_id IS NOT NULL) AS completed
        FROM baza.guide_lessons l
        LEFT JOIN baza.guide_progress gp ON gp.lesson_id = l.id AND gp.tg_id = $1
        WHERE l.slug = $2 AND l.published
        """,
        user["tg_id"], slug,
    )
    if not row:
        raise HTTPException(404, "Урок не найден")
    lesson = dict(row)

    related_tools = await pool.fetch(
        "SELECT repo, name, description_ru FROM baza.tools WHERE repo = ANY($1) AND published",
        lesson["related_tools"],
    ) if lesson["related_tools"] else []
    related_prompts = await pool.fetch(
        "SELECT slug, title, category FROM baza.prompts WHERE slug = ANY($1)",
        lesson["related_prompts"],
    ) if lesson["related_prompts"] else []
    lesson["related_tools"] = [dict(r) for r in related_tools]
    lesson["related_prompts"] = [dict(r) for r in related_prompts]
    return lesson


@router.post("/lessons/{slug}/complete")
async def complete_lesson(slug: str, user: dict = Depends(require_subscribed)):
    pool = get_pool()
    lesson = await pool.fetchrow(
        "SELECT id FROM baza.guide_lessons WHERE slug = $1 AND published", slug,
    )
    if not lesson:
        raise HTTPException(404, "Урок не найден")
    await pool.execute(
        """
        INSERT INTO baza.guide_progress (tg_id, lesson_id)
        VALUES ($1, $2)
        ON CONFLICT (tg_id, lesson_id) DO NOTHING
        """,
        user["tg_id"], lesson["id"],
    )
    return {"completed": True}


@router.get("/progress")
async def get_progress(user: dict = Depends(require_subscribed)):
    pool = get_pool()
    total = await pool.fetchval("SELECT count(*) FROM baza.guide_lessons WHERE published")
    completed = await pool.fetchval(
        """
        SELECT count(*) FROM baza.guide_progress gp
        JOIN baza.guide_lessons l ON l.id = gp.lesson_id AND l.published
        WHERE gp.tg_id = $1
        """,
        user["tg_id"],
    )
    percent = round(completed / total * 100) if total else 0

    # Первый непройденный урок по порядку — для карточки "продолжить" на Home.
    next_row = await pool.fetchrow(
        """
        SELECT l.slug, l.level, l.title
        FROM baza.guide_lessons l
        LEFT JOIN baza.guide_progress gp ON gp.lesson_id = l.id AND gp.tg_id = $1
        WHERE l.published AND gp.lesson_id IS NULL
        ORDER BY l.level, l.order_in_level
        LIMIT 1
        """,
        user["tg_id"],
    )
    next_lesson = dict(next_row) if next_row else None
    return {"completed": completed, "total": total, "percent": percent, "next_lesson": next_lesson}
