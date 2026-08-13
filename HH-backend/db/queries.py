from db.connection import query, query_one, execute
from nanoid import generate
from datetime import datetime
import logging

logger = logging.getLogger("hh-backend.queries")


async def create_card(card_data: dict) -> dict | None:
    card_id = generate(size=10)
    result = await query_one(
        """INSERT INTO generations (id, slug, format, name, role, ai_title, image_url, storage_type, share_count)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1)
           RETURNING *""",
        card_id, card_id, card_data["format"], card_data["name"],
        card_data["role"], card_data["title"], card_data["image_url"],
        card_data.get("storage_type", "local"),
    )
    return dict(result) if result else None


async def get_card_by_slug(slug: str) -> dict | None:
    result = await query_one("SELECT * FROM generations WHERE slug = $1", slug)
    return dict(result) if result else None


async def get_card_by_id(card_id: str) -> dict | None:
    result = await query_one("SELECT * FROM generations WHERE id = $1", card_id)
    return dict(result) if result else None


async def get_cards(limit: int = 30, offset: int = 0) -> list[dict]:
    results = await query(
        "SELECT * FROM generations ORDER BY created_at DESC LIMIT $1 OFFSET $2",
        limit, offset,
    )
    return [dict(r) for r in results]


async def increment_share(slug: str) -> dict | None:
    result = await query_one(
        "UPDATE generations SET share_count = share_count + 1 WHERE slug = $1 RETURNING *",
        slug,
    )
    return dict(result) if result else None


async def increment_download(card_id: str) -> dict | None:
    result = await query_one(
        "UPDATE generations SET download_count = download_count + 1 WHERE id = $1 RETURNING *",
        card_id,
    )
    return dict(result) if result else None


async def delete_card(card_id: str) -> bool:
    result = await execute("DELETE FROM generations WHERE id = $1", card_id)
    return result


async def count_cards() -> int:
    result = await query_one("SELECT COUNT(*)::int as count FROM generations")
    return result["count"] if result else 0


async def count_by_format() -> list[dict]:
    results = await query(
        "SELECT format, COUNT(*)::int as count FROM generations GROUP BY format"
    )
    return [dict(r) for r in results]


async def count_today() -> int:
    result = await query_one(
        "SELECT COUNT(*)::int as count FROM generations WHERE created_at >= CURRENT_DATE"
    )
    return result["count"] if result else 0


async def total_shares() -> int:
    result = await query_one(
        "SELECT COALESCE(SUM(share_count), 0)::int as total FROM generations"
    )
    return result["total"] if result else 0


async def shares_today() -> int:
    result = await query_one(
        "SELECT COALESCE(SUM(share_count), 0)::int as total FROM generations WHERE created_at >= CURRENT_DATE"
    )
    return result["total"] if result else 0


async def get_timeline(days: int = 7) -> list[dict]:
    results = await query(
        """SELECT
            TO_CHAR(DATE(created_at), 'Dy') as day,
            DATE(created_at) as date,
            COUNT(*)::int as generations,
            COALESCE(SUM(share_count), 0)::int as shares
           FROM generations
           WHERE created_at >= NOW() - ($1::text || ' days')::INTERVAL
           GROUP BY DATE(created_at), TO_CHAR(DATE(created_at), 'Dy')
           ORDER BY DATE(created_at)""",
        str(days),
    )
    return [dict(r) for r in results]


async def is_admin(clerk_user_id: str) -> bool:
    result = await query_one(
        "SELECT 1 FROM admin_users WHERE clerk_user_id = $1", clerk_user_id
    )
    return result is not None


async def get_admin_stats() -> dict:
    total = await count_cards()
    format_counts = await count_by_format()
    today = await count_today()
    shares_total = await total_shares()
    shares_today_val = await shares_today()

    format_a = next((f["count"] for f in format_counts if f["format"] == "A"), 0)
    format_b = next((f["count"] for f in format_counts if f["format"] == "B"), 0)
    format_b_ratio = round((format_b / total * 100)) if total > 0 else 0
    share_rate = round((shares_total / total * 100)) if total > 0 else 0

    return {
        "totalCards": total,
        "formatBRatio": format_b_ratio,
        "shareRate": share_rate,
        "todayCount": today,
        "sharesToday": shares_today_val,
    }


async def search_cards(term: str) -> list[dict]:
    results = await query(
        """SELECT * FROM generations
           WHERE name ILIKE $1 OR role ILIKE $1 OR ai_title ILIKE $1
           ORDER BY created_at DESC LIMIT 50""",
        f"%{term}%",
    )
    return [dict(r) for r in results]


async def is_first_user() -> bool:
    result = await query_one("SELECT 1 FROM users LIMIT 1")
    return result is None


async def get_or_create_user(clerk_user_id: str, email: str) -> dict:
    existing = await query_one(
        "SELECT * FROM users WHERE clerk_user_id = $1", clerk_user_id
    )
    if existing:
        return dict(existing)

    first = await is_first_user()
    result = await query_one(
        """INSERT INTO users (clerk_user_id, email, is_admin)
           VALUES ($1, $2, $3)
           ON CONFLICT (clerk_user_id) DO UPDATE SET email = EXCLUDED.email
           RETURNING *""",
        clerk_user_id, email, first,
    )
    return dict(result) if result else {"clerk_user_id": clerk_user_id, "email": email, "is_admin": first}


async def is_user_admin(clerk_user_id: str) -> bool:
    result = await query_one(
        "SELECT is_admin FROM users WHERE clerk_user_id = $1", clerk_user_id
    )
    if result:
        return result["is_admin"]
    legacy = await query_one(
        "SELECT 1 FROM admin_users WHERE clerk_user_id = $1", clerk_user_id
    )
    return legacy is not None
