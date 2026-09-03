from fastapi import APIRouter, Depends

from app.db import get_pool, get_redis
from app.deps import require_subscribed

router = APIRouter(prefix="/api/home", tags=["home"], dependencies=[Depends(require_subscribed)])

# Подписчики канала синкаются раз в час отдельным cron-скриптом (scripts/sync_subscribers_count.py)
# в этот ключ Redis — не дёргаем getChatMemberCount синхронно на каждый заход в /api/home.
SUBSCRIBERS_REDIS_KEY = "baza:stats:subscribers"


@router.get("")
async def home():
    pool = get_pool()
    counts = await pool.fetchrow(
        """
        SELECT
            (SELECT count(*) FROM baza.entries WHERE published) AS entries_count,
            (SELECT count(*) FROM baza.tools WHERE published) AS tools_count,
            (SELECT count(*) FROM baza.prompts WHERE published) AS prompts_count
        """
    )
    stats_row = await pool.fetchrow(
        """
        SELECT
            (SELECT count(*) FROM baza.entries WHERE published) AS entries_count,
            (SELECT count(*) FROM baza.tools WHERE published) AS tools_count,
            (SELECT count(*) FROM baza.prompts WHERE published) AS prompts_count,
            (SELECT COALESCE(SUM(copies_count), 0) FROM baza.prompts) AS total_copies,
            (SELECT count(*) FROM baza.users) AS users_count
        """
    )
    subscribers_raw = await get_redis().get(SUBSCRIBERS_REDIS_KEY)
    stats = dict(stats_row)
    stats["subscribers"] = int(subscribers_raw) if subscribers_raw is not None else None

    top_prompts = await pool.fetch(
        "SELECT slug, title, category, copies_count FROM baza.prompts WHERE published ORDER BY copies_count DESC LIMIT 5"
    )
    # 10 свежих статей вместо одной «статьи недели». Ранжирование именно по свежести,
    # а не по просмотрам: на 03.09.2026 в baza.events всего 112 событий view_entry на
    # 39 статей из 185 — «топ по просмотрам» замкнул бы главную на эти 39 навсегда,
    # а остальные никогда бы не всплыли. Пересмотреть, когда событий станет заметно больше.
    recent_entries = await pool.fetch(
        """
        SELECT slug, title, section, group_slug, updated_at FROM baza.entries
        WHERE published ORDER BY updated_at DESC LIMIT 10
        """
    )
    # Топ-10 по абсолютным звёздам GitHub. Раньше здесь был «топ недели» по приросту
    # (stars - stars_prev): живее, но наверх лезли мелкие репозитории со всплеском,
    # и топом это назвать было сложно. Звёзды — внешний сигнал, не зависящий от трафика
    # приложения; обновляются еженедельным cron-синком (/etc/cron.d/botyard-baza-stars).
    top_tools = await pool.fetch(
        """
        SELECT id, repo, name, description_ru, category, stars, badge,
               (stars - stars_prev) AS growth
        FROM baza.tools
        WHERE published = true AND archived = false
        ORDER BY stars DESC
        LIMIT 10
        """
    )
    return {
        "counts": dict(counts),
        "stats": stats,
        "top_prompts": [dict(r) for r in top_prompts],
        "recent_entries": [dict(r) for r in recent_entries],
        "top_tools": [dict(r) for r in top_tools],
    }
