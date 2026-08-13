from fastapi import APIRouter
from models.schemas import TitleRequest, TitleResponse
from services.ai_title import generate_title
import logging

logger = logging.getLogger("hh-backend.routes.title")
router = APIRouter(prefix="/api", tags=["title"])


@router.post("/title", response_model=TitleResponse)
async def generate_ai_title(req: TitleRequest):
    title, source = await generate_title(
        stack=req.stack, name=req.name, role=req.role
    )
    return TitleResponse(title=title, source=source)
