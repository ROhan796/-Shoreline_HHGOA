from fastapi import APIRouter, HTTPException, Depends
from models.schemas import CardCreate, CardResponse, card_db_to_response
from db.queries import create_card, get_card_by_slug, get_card_by_id, get_cards, increment_share, delete_card
from services.storage import upload_image, delete_image
from middleware.clerk_auth import require_admin
import logging
from nanoid import generate as nanoid_generate

logger = logging.getLogger("hh-backend.routes.cards")
router = APIRouter(prefix="/api", tags=["cards"])


@router.post("/cards", response_model=dict)
async def save_card(card: CardCreate):
    try:
        image_url = ""
        storage_type = "local"
        slug_placeholder = nanoid_generate(size=10)

        if card.imageDataUrl:
            image_url, storage_type = await upload_image(card.imageDataUrl, slug_placeholder)

        card_data = {
            "format": card.format,
            "name": card.name,
            "role": card.role,
            "title": card.title,
            "image_url": image_url,
            "storage_type": storage_type,
        }

        saved = await create_card(card_data)
        if not saved:
            raise HTTPException(status_code=500, detail="Failed to save card")

        return {
            "success": True,
            "card": {
                "id": saved["id"],
                "slug": saved["slug"],
                "format": saved["format"],
                "name": saved.get("name") or card.name,
                "role": saved.get("role") or card.role,
                "title": saved.get("ai_title") or card.title,
                "imageDataUrl": card.imageDataUrl if not image_url else "",
                "imageUrl": image_url,
                "createdAt": saved["created_at"].isoformat() if hasattr(saved["created_at"], "isoformat") else str(saved["created_at"]),
                "sharesCount": saved.get("share_count", 1),
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Save card error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/cards")
async def list_cards():
    cards = await get_cards(limit=30)
    return {
        "cards": [
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
    }


@router.get("/cards/{slug}")
async def get_card(slug: str):
    card = await get_card_by_slug(slug)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    await increment_share(slug)
    card = await get_card_by_slug(slug)

    return {
        "card": {
            "id": card["id"],
            "slug": card["slug"],
            "format": card["format"],
            "name": card.get("name") or "Shoreline Builder",
            "role": card.get("role") or "Hacker",
            "title": card.get("ai_title") or "Protocol Architect",
            "imageDataUrl": card.get("image_url") or "",
            "imageUrl": card.get("image_url") or "",
            "createdAt": card["created_at"].isoformat() if hasattr(card["created_at"], "isoformat") else str(card.get("created_at", "")),
            "sharesCount": card.get("share_count", 1),
        }
    }


@router.delete("/cards/{card_id}")
async def remove_card(card_id: str, user: dict = Depends(require_admin)):
    deleted = await delete_card(card_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Card not found")
    return {"success": True}
