from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CardCreate(BaseModel):
    format: str = "B"
    name: str = "Shoreline Builder"
    role: str = "Hacker"
    title: str = "Protocol Architect"
    imageDataUrl: str = ""


class CardResponse(BaseModel):
    id: str
    slug: str
    format: str
    name: str
    role: str
    title: str
    imageDataUrl: str
    createdAt: str
    sharesCount: int


class CardInDB(BaseModel):
    id: str
    slug: str
    format: str
    name: str | None = None
    role: str | None = None
    ai_title: str | None = None
    image_url: str = ""
    storage_type: str = "local"
    share_count: int = 1
    download_count: int = 0
    created_at: str | None = None


class TitleRequest(BaseModel):
    stack: str = ""
    name: str = ""
    role: str = ""


class TitleResponse(BaseModel):
    title: str
    source: str


class AdminStats(BaseModel):
    totalCards: int
    formatBRatio: int
    shareRate: int
    todayCount: int
    sharesToday: int


class TimelinePoint(BaseModel):
    day: str
    generations: int
    shares: int


class AdminStatsResponse(BaseModel):
    stats: AdminStats
    timeline: list[TimelinePoint]
    cards: list[CardResponse]


class HealthResponse(BaseModel):
    status: str
    timestamp: str
    database: str
    storage: str


def card_db_to_response(card: dict) -> CardResponse:
    return CardResponse(
        id=card["id"],
        slug=card["slug"],
        format=card["format"],
        name=card.get("name") or "Shoreline Builder",
        role=card.get("role") or "Hacker",
        title=card.get("ai_title") or card.get("title") or "Protocol Architect",
        imageDataUrl=card.get("image_url") or card.get("imageDataUrl") or "",
        createdAt=card["created_at"].isoformat() if isinstance(card.get("created_at"), datetime) else str(card.get("created_at", "")),
        sharesCount=card.get("share_count") or card.get("sharesCount") or 1,
    )
