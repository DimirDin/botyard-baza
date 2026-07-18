import json

import asyncpg
import redis.asyncio as redis
from app.config import settings

pg_pool: asyncpg.Pool | None = None
redis_client: redis.Redis | None = None


async def _init_connection(conn: asyncpg.Connection) -> None:
    # Без кодека asyncpg отправляет/получает jsonb только как str — Python dict
    # ловит "expected str, got dict" при INSERT (см. baza.events.payload).
    await conn.set_type_codec(
        "jsonb",
        encoder=json.dumps,
        decoder=json.loads,
        schema="pg_catalog",
    )


async def init_db():
    global pg_pool, redis_client
    pg_pool = await asyncpg.create_pool(
        settings.database_url,
        min_size=2,
        max_size=10,
        command_timeout=30,
        init=_init_connection,
    )
    redis_client = redis.from_url(settings.redis_url, decode_responses=True)


async def close_db():
    if pg_pool:
        await pg_pool.close()
    if redis_client:
        await redis_client.close()


def get_pool() -> asyncpg.Pool:
    assert pg_pool is not None, "DB pool not initialized — call init_db() on startup"
    return pg_pool


def get_redis() -> redis.Redis:
    assert redis_client is not None, "Redis not initialized — call init_db() on startup"
    return redis_client
