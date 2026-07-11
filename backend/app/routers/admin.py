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
        
        # 6. Feature usage (30d)
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
        
    return {
        "total_users": total_users or 0,
        "subscribed_users": subscribed_users or 0,
        "dau": dau or 0,
        "wau": wau or 0,
        "mau": mau or 0,
        "feature_usage": feature_usage
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
            "is_subscribed": r["is_subscribed"]
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
            "username": r["username"]
        }
        for r in records
    ]
