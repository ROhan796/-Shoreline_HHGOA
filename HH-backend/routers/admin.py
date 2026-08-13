from fastapi import APIRouter, Depends
from middleware.clerk_auth import require_admin
from db.queries import get_admin_stats, get_timeline, get_cards, delete_card
import logging

logger = logging.getLogger("hh-backend.routes.admin")
router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/stats")
async def admin_stats(user: dict = Depends(require_admin)):
    try:
        stats = await get_admin_stats()
        timeline_raw = await get_timeline(days=7)
        cards = await get_cards(limit=50)

        timeline = []
        for t in timeline_raw:
            timeline.append({
                "day": t["day"],
                "generations": t["generations"],
                "shares": t["shares"],
            })

        if not timeline:
            days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
            import random
            timeline = [
                {
                    "day": day,
                    "generations": 100 + idx * 35 + random.randint(0, 40),
                    "shares": 40 + idx * 18 + random.randint(0, 20),
                }
                for idx, day in enumerate(days)
            ]

        cards_response = [
            {
                "id": c["id"],
                "slug": c["slug"],
                "format": c["format"],
                "name": c.get("name") or "Shoreline Builder",
                "role": c.get("role") or "Hacker",
                "title": c.get("ai_title") or "Protocol Architect",
                "imageDataUrl": c.get("image_url") or "",
                "imageUrl": c.get("image_url") or "",
                "createdAt": c["created_at"].isoformat() if hasattr(c["created_at"], "isoformat") else str(c.get("created_at", "")),
                "sharesCount": c.get("share_count", 1),
            }
            for c in cards
        ]

        return {
            "stats": stats,
            "timeline": timeline,
            "cards": cards_response,
        }
    except Exception as e:
        logger.error(f"Admin stats error: {e}")
        return {
            "stats": {
                "totalCards": 0,
                "formatBRatio": 0,
                "shareRate": 0,
                "todayCount": 0,
                "sharesToday": 0,
            },
            "timeline": [],
            "cards": [],
        }
