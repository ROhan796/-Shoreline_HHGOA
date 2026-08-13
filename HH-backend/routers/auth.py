from fastapi import APIRouter, Depends
from middleware.clerk_auth import get_current_user
from db.queries import get_or_create_user, is_user_admin
from config import settings
import logging

logger = logging.getLogger("hh-backend.routes.auth")
router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    clerk_user_id = user.get("sub", "")
    email = user.get("email", "")

    if not clerk_user_id or clerk_user_id == "dev_user":
        if settings.ENVIRONMENT == "development":
            return {"is_admin": True, "email": email or "dev@example.com"}
        return {"is_admin": False, "email": email}

    await get_or_create_user(clerk_user_id, email)
    admin_status = await is_user_admin(clerk_user_id)

    return {"is_admin": admin_status, "email": email}
