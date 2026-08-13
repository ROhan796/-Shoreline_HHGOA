import asyncpg
import psycopg2
from config import settings
import logging

logger = logging.getLogger("hh-backend.db")

_pool: asyncpg.Pool | None = None


async def get_pool() -> asyncpg.Pool | None:
    global _pool
    if not settings.is_db_configured:
        return None
    if _pool is None:
        try:
            _pool = await asyncpg.create_pool(
                dsn=settings.DATABASE_URL,
                min_size=2,
                max_size=10,
                command_timeout=10,
            )
            logger.info("Database pool created successfully")
        except Exception as e:
            logger.error(f"Failed to create database pool: {e}")
            return None
    return _pool


async def close_pool():
    global _pool
    if _pool:
        await _pool.close()
        _pool = None
        logger.info("Database pool closed")


async def query(sql: str, *args):
    pool = await get_pool()
    if not pool:
        return []
    try:
        async with pool.acquire() as conn:
            rows = await conn.fetch(sql, *args)
            return rows
    except Exception as e:
        logger.error(f"Query error: {e}")
        return []


async def query_one(sql: str, *args):
    pool = await get_pool()
    if not pool:
        return None
    try:
        async with pool.acquire() as conn:
            row = await conn.fetchrow(sql, *args)
            return row
    except Exception as e:
        logger.error(f"Query error: {e}")
        return None


async def execute(sql: str, *args):
    pool = await get_pool()
    if not pool:
        return False
    try:
        async with pool.acquire() as conn:
            await conn.execute(sql, *args)
            return True
    except Exception as e:
        logger.error(f"Execute error: {e}")
        return False


async def test_connection() -> bool:
    pool = await get_pool()
    if not pool:
        logger.warning("No database configured, skipping connection test")
        return False
    try:
        async with pool.acquire() as conn:
            await conn.fetchval("SELECT NOW()")
            logger.info("Database connected successfully")
            return True
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return False


def sync_query(sql: str, *args):
    """Synchronous query for migration scripts."""
    if not settings.is_db_configured:
        return []
    try:
        conn = psycopg2.connect(settings.DATABASE_URL)
        cur = conn.cursor()
        cur.execute(sql, args)
        rows = cur.fetchall()
        col_names = [desc[0] for desc in cur.description] if cur.description else []
        cur.close()
        conn.close()
        return [dict(zip(col_names, row)) for row in rows]
    except Exception as e:
        logger.error(f"Sync query error: {e}")
        return []
