from fastapi import APIRouter, Depends
from app.db import get_pool
from app.deps import require_admin

router = APIRouter(prefix="/api/admin", tags=["admin"], dependencies=[Depends(require_admin)])


@router.get("/stats")
async def get_admin_stats(user: dict = Depends(require_admin)):
    pool = get_pool()
    async with pool.acquire() as conn:
        # 1. Total users
        total_users = await conn.fetchval("SELECT COUNT(*) FROM baza.users")

        # 2. Subscribed users
        subscribed_users = await conn.fetchval("SELECT COUNT(*) FROM baza.users WHERE is_subscribed = true")

        # 3. DAU (24h)
        dau = await conn.fetchval(
            """
            SELECT COUNT(DISTINCT tg_id) FROM (
                SELECT tg_id FROM baza.users WHERE last_seen >= now() - INTERVAL '24 hours'
                UNION
                SELECT tg_id FROM baza.events WHERE created_at >= now() - INTERVAL '24 hours'
            ) AS active
            """
        )

        # 4. WAU (7d)
        wau = await conn.fetchval(
            """
            SELECT COUNT(DISTINCT tg_id) FROM (
                SELECT tg_id FROM baza.users WHERE last_seen >= now() - INTERVAL '7 days'
                UNION
                SELECT tg_id FROM baza.events WHERE created_at >= now() - INTERVAL '7 days'
            ) AS active
            """
        )

        # 5. MAU (30d)
        mau = await conn.fetchval(
            """
            SELECT COUNT(DISTINCT tg_id) FROM (
                SELECT tg_id FROM baza.users WHERE last_seen >= now() - INTERVAL '30 days'
                UNION
                SELECT tg_id FROM baza.events WHERE created_at >= now() - INTERVAL '30 days'
            ) AS active
            """
        )

        # 6. Feature usage (30d) — типы событий (view_entry/view_tool/search/...)
        usage_records = await conn.fetch(
            """
            SELECT event, COUNT(*) as count
            FROM baza.events
            WHERE created_at >= now() - INTERVAL '30 days'
            GROUP BY event
            ORDER BY count DESC
            """
        )
        feature_usage = [{"event": r["event"], "count": r["count"]} for r in usage_records]

        # 7. Источники трафика — src_vcru/src_ads1/... из deep link бота, см. §16
        source_records = await conn.fetch(
            """
            SELECT COALESCE(source, 'organic') AS source, COUNT(*) AS count
            FROM baza.users
            GROUP BY source
            ORDER BY count DESC
            """
        )
        sources = [{"source": r["source"], "count": r["count"]} for r in source_records]

    return {
        "total_users": total_users or 0,
        "subscribed_users": subscribed_users or 0,
        "dau": dau or 0,
        "wau": wau or 0,
        "mau": mau or 0,
        "feature_usage": feature_usage,
        "sources": sources,
    }


@router.get("/analytics")
async def get_admin_analytics(user: dict = Depends(require_admin)):
    """Чем интересуются люди: тренд активности, топ контента, топ-запросы поиска, рейтинги, избранное."""
    pool = get_pool()
    async with pool.acquire() as conn:
        # Тренд за 14 дней: активные (по events, тк last_seen хранит только последний визит —
        # ретроспективный DAU по users восстановить нельзя) + новые регистрации по дням
        trend_records = await conn.fetch(
            """
            WITH days AS (
                SELECT generate_series(current_date - INTERVAL '13 days', current_date, INTERVAL '1 day')::date AS day
            ),
            activity AS (
                SELECT date_trunc('day', created_at)::date AS day, COUNT(DISTINCT tg_id) AS active
                FROM baza.events
                WHERE created_at >= current_date - INTERVAL '13 days'
                GROUP BY 1
            ),
            signups AS (
                SELECT date_trunc('day', first_seen)::date AS day, COUNT(*) AS new_users
                FROM baza.users
                WHERE first_seen >= current_date - INTERVAL '13 days'
                GROUP BY 1
            )
            SELECT d.day, COALESCE(a.active, 0) AS active, COALESCE(s.new_users, 0) AS new_users
            FROM days d
            LEFT JOIN activity a ON a.day = d.day
            LEFT JOIN signups s ON s.day = d.day
            ORDER BY d.day
            """
        )
        activity_trend = [
            {"day": r["day"].isoformat(), "active": r["active"], "new_users": r["new_users"]}
            for r in trend_records
        ]

        # Топ статей по просмотрам (событие view_entry, payload денормализован на фронте
        # в момент трекинга — устойчиво к переименованию/удалению статьи)
        top_entries_records = await conn.fetch(
            """
            SELECT payload->>'slug' AS slug,
                   MAX(payload->>'title') AS title,
                   MAX(payload->>'section') AS section,
                   COUNT(*) AS views
            FROM baza.events
            WHERE event = 'view_entry' AND created_at >= now() - INTERVAL '30 days'
              AND payload->>'slug' IS NOT NULL
            GROUP BY payload->>'slug'
            ORDER BY views DESC
            LIMIT 10
            """
        )
        top_entries = [dict(r) for r in top_entries_records]

        # Топ инструментов по просмотрам
        top_tools_records = await conn.fetch(
            """
            SELECT payload->>'repo' AS repo,
                   MAX(payload->>'name') AS name,
                   MAX(payload->>'category') AS category,
                   COUNT(*) AS views
            FROM baza.events
            WHERE event = 'view_tool' AND created_at >= now() - INTERVAL '30 days'
              AND payload->>'repo' IS NOT NULL
            GROUP BY payload->>'repo'
            ORDER BY views DESC
            LIMIT 10
            """
        )
        top_tools = [dict(r) for r in top_tools_records]

        # Топ поисковых запросов
        top_searches_records = await conn.fetch(
            """
            SELECT lower(payload->>'q') AS query, COUNT(*) AS count
            FROM baza.events
            WHERE event = 'search' AND created_at >= now() - INTERVAL '30 days'
              AND payload->>'q' IS NOT NULL AND payload->>'q' != ''
            GROUP BY lower(payload->>'q')
            ORDER BY count DESC
            LIMIT 15
            """
        )
        top_searches = [dict(r) for r in top_searches_records]

        # Интерес по разделам Базы (code/chat/design/theory)
        section_records = await conn.fetch(
            """
            SELECT payload->>'section' AS section, COUNT(*) AS views
            FROM baza.events
            WHERE event = 'view_entry' AND created_at >= now() - INTERVAL '30 days'
              AND payload->>'section' IS NOT NULL
            GROUP BY payload->>'section'
            ORDER BY views DESC
            """
        )
        section_interest = [dict(r) for r in section_records]

        # Топ промптов по копированиям — copies_count уже надёжно считается на бэкенде
        top_prompts_records = await conn.fetch(
            """
            SELECT slug, title, category, copies_count
            FROM baza.prompts
            WHERE published AND copies_count > 0
            ORDER BY copies_count DESC
            LIMIT 10
            """
        )
        top_prompts = [dict(r) for r in top_prompts_records]

        # Рейтинги статей — самые полезные и самые проблемные (кандидаты на доработку контента)
        top_liked_records = await conn.fetch(
            """
            SELECT e.slug, e.title,
                   COALESCE(SUM(r.value) FILTER (WHERE r.value = 1), 0) AS likes,
                   COALESCE(-SUM(r.value) FILTER (WHERE r.value = -1), 0) AS dislikes
            FROM baza.entries e
            JOIN baza.entry_ratings r ON r.entry_id = e.id
            GROUP BY e.id
            HAVING COALESCE(SUM(r.value) FILTER (WHERE r.value = 1), 0) > 0
            ORDER BY likes DESC
            LIMIT 5
            """
        )
        top_liked = [dict(r) for r in top_liked_records]

        top_disliked_records = await conn.fetch(
            """
            SELECT e.slug, e.title,
                   COALESCE(SUM(r.value) FILTER (WHERE r.value = 1), 0) AS likes,
                   COALESCE(-SUM(r.value) FILTER (WHERE r.value = -1), 0) AS dislikes
            FROM baza.entries e
            JOIN baza.entry_ratings r ON r.entry_id = e.id
            GROUP BY e.id
            HAVING COALESCE(-SUM(r.value) FILTER (WHERE r.value = -1), 0) > 0
            ORDER BY dislikes DESC
            LIMIT 5
            """
        )
        top_disliked = [dict(r) for r in top_disliked_records]

        # Избранное — что чаще всего сохраняют "на потом"
        favorites_records = await conn.fetch(
            """
            WITH fav_counts AS (
                SELECT item_type, item_id, COUNT(*) AS cnt
                FROM baza.favorites
                GROUP BY item_type, item_id
            )
            SELECT 'entry' AS item_type, e.slug AS ref, e.title AS title, f.cnt AS count
            FROM fav_counts f JOIN baza.entries e ON e.id = f.item_id AND f.item_type = 'entry'
            UNION ALL
            SELECT 'tool', t.repo, t.name, f.cnt
            FROM fav_counts f JOIN baza.tools t ON t.id = f.item_id AND f.item_type = 'tool'
            UNION ALL
            SELECT 'prompt', p.slug, p.title, f.cnt
            FROM fav_counts f JOIN baza.prompts p ON p.id = f.item_id AND f.item_type = 'prompt'
            ORDER BY count DESC
            LIMIT 10
            """
        )
        top_favorites = [dict(r) for r in favorites_records]

    return {
        "activity_trend": activity_trend,
        "top_entries": top_entries,
        "top_tools": top_tools,
        "top_searches": top_searches,
        "section_interest": section_interest,
        "top_prompts": top_prompts,
        "top_liked": top_liked,
        "top_disliked": top_disliked,
        "top_favorites": top_favorites,
    }


@router.get("/users")
async def get_admin_users(user: dict = Depends(require_admin)):
    pool = get_pool()
    async with pool.acquire() as conn:
        records = await conn.fetch(
            """
            SELECT tg_id, username, first_seen, last_seen, is_subscribed
            FROM baza.users
            ORDER BY first_seen DESC
            LIMIT 50
            """
        )
    return [
        {
            "tg_id": r["tg_id"],
            "username": r["username"],
            "first_seen": r["first_seen"].isoformat() if r["first_seen"] else None,
            "last_seen": r["last_seen"].isoformat() if r["last_seen"] else None,
            "is_subscribed": r["is_subscribed"],
        }
        for r in records
    ]


@router.get("/events")
async def get_admin_events(user: dict = Depends(require_admin)):
    pool = get_pool()
    async with pool.acquire() as conn:
        records = await conn.fetch(
            """
            SELECT e.id, e.tg_id, e.event, e.payload, e.created_at, u.username
            FROM baza.events e
            LEFT JOIN baza.users u ON e.tg_id = u.tg_id
            ORDER BY e.created_at DESC
            LIMIT 100
            """
        )
    return [
        {
            "id": r["id"],
            "tg_id": r["tg_id"],
            "event": r["event"],
            "payload": r["payload"],
            "created_at": r["created_at"].isoformat() if r["created_at"] else None,
            "username": r["username"],
        }
        for r in records
    ]
