from fastapi import APIRouter, Depends

from app.db import get_pool, get_redis
from app.deps import require_subscribed

router = APIRouter(prefix="/api/home", tags=["home"], dependencies=[Depends(require_subscribed)])

# Подписчики канала синкаются раз в час отдельным cron-скриптом (scripts/sync_subscribers_count.py)
# в этот ключ Redis — не дёргаем getChatMemberCount синхронно на каждый заход в /api/home.
SUBSCRIBERS_REDIS_KEY = "baza:stats:subscribers"


@router.get("")
async def home(user: dict = Depends(require_subscribed)):
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
    #
    # До 20.09.2026 эта сортировка не работала: sync_content.py переписывал updated_at
    # у всех строк на now() при каждом синке, и на 197 статьях в БД было ровно ОДНО
    # различное значение — Postgres отдавал произвольную десятку. Починено в синке
    # (updated_at двигается только при реальной правке текста) плюс разовая засевка
    # датами появления из git (scripts/backfill_entry_dates.py).
    # id DESC — устойчивый разрыв ничьих: у статей, залитых одной партией, отметка
    # совпадает с точностью до секунд, и без него порядок внутри партии случайный.
    recent_entries = await pool.fetch(
        """
        SELECT slug, title, section, group_slug, updated_at FROM baza.entries
        WHERE published ORDER BY updated_at DESC, id DESC LIMIT 10
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
    # Что прибавилось с прошлого захода. prev_seen хранит отметку ПРЕДЫДУЩЕГО
    # визита (миграция 0012): last_seen для этого не годится — гейт обновляет его
    # на now() в том же запросе, которым проверяет подписку.
    #
    # NULL = первый визит: ничего не показываем, иначе новичок увидел бы
    # «197 новых статей». Нули тоже не показываем — плашка появляется, только
    # если реально есть что смотреть.
    prev_seen = await pool.fetchval("SELECT prev_seen FROM baza.users WHERE tg_id = $1", user["tg_id"])
    whats_new = None
    if prev_seen is not None:
        row = await pool.fetchrow(
            """
            SELECT
                (SELECT count(*) FROM baza.entries
                  WHERE published AND updated_at > $1) AS entries,
                (SELECT count(*) FROM baza.tools
                  WHERE published AND NOT archived AND added_at > $1) AS tools
            """,
            prev_seen,
        )
        if row["entries"] or row["tools"]:
            whats_new = {
                "entries": row["entries"],
                "tools": row["tools"],
                "since": prev_seen.isoformat(),
            }

    return {
        "whats_new": whats_new,
        "counts": dict(counts),
        "stats": stats,
        "top_prompts": [dict(r) for r in top_prompts],
        "recent_entries": [dict(r) for r in recent_entries],
        "top_tools": [dict(r) for r in top_tools],
    }
