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
        "SELECT slug, title, category, copies_count FROM baza.prompts WHERE published ORDER BY copies_count DESC LIMIT 3"
    )
    recent_entries = await pool.fetch(
        "SELECT slug, title, updated_at FROM baza.entries WHERE published ORDER BY updated_at DESC LIMIT 5"
    )
    return {
        "counts": dict(counts),
        "stats": stats,
        "top_prompts": [dict(r) for r in top_prompts],
        "recent_entries": [dict(r) for r in recent_entries],
    }
