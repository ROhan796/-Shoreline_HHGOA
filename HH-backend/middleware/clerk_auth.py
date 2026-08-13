from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import httpx
import logging
from config import settings

logger = logging.getLogger("hh-backend.clerk")

security = HTTPBearer(auto_error=False)

_jwks_cache: dict = {}


async def _fetch_jwks() -> dict:
    global _jwks_cache
    if _jwks_cache:
        return _jwks_cache
    if not settings.CLERK_SECRET_KEY:
        return {}
    try:
        headers = {"Authorization": f"Bearer {settings.CLERK_SECRET_KEY}"}
        async with httpx.AsyncClient() as client:
            resp = await client.get("https://api.clerk.com/v1/jwks", headers=headers, timeout=10)
            if resp.status_code == 200:
                keys = resp.json().get("keys", [])
                _jwks_cache = {k["kid"]: k for k in keys}
                logger.info(f"Fetched {len(keys)} JWKS keys")
                return _jwks_cache
            logger.error(f"JWKS fetch failed: {resp.status_code}")
            return {}
    except Exception as e:
        logger.error(f"JWKS fetch error: {e}")
        return {}


def _get_signing_key(jwks: dict, kid: str):
    from jose.utils import long_to_bytes
    from cryptography.hazmat.primitives.asymmetric import rsa
    key_data = jwks.get(kid)
    if not key_data:
        return None
    n = int.from_bytes(long_to_bytes(int(key_data["n"], 64)), "big")
    e = int.from_bytes(long_to_bytes(int(key_data["e"], 64)), "big")
    return rsa.RSAPublicNumbers(e, n).public_key()


async def verify_clerk_token(token: str) -> dict:
    if not settings.is_clerk_configured:
        if settings.ENVIRONMENT == "development":
            return {"sub": "dev_user", "email": "dev@example.com"}
        raise HTTPException(status_code=501, detail="Clerk not configured")
    jwks = await _fetch_jwks()
    if not jwks:
        raise HTTPException(status_code=501, detail="Clerk JWKS not available")
    try:
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        if not kid or kid not in jwks:
            raise HTTPException(status_code=401, detail="Invalid token")
        key = _get_signing_key(jwks, kid)
        if not key:
            raise HTTPException(status_code=401, detail="Invalid key")
        payload = jwt.decode(token, key, algorithms=["RS256"], options={"verify_aud": False})
        return payload
    except JWTError as e:
        logger.error(f"JWT verification failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token verification error: {e}")
        raise HTTPException(status_code=401, detail="Token verification failed")


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    if not credentials:
        if settings.ENVIRONMENT == "development":
            return {"sub": "dev_user", "email": "dev@example.com"}
        raise HTTPException(status_code=401, detail="Not authenticated")
    return await verify_clerk_token(credentials.credentials)


async def require_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    if not credentials:
        if settings.ENVIRONMENT == "development":
            return {"sub": "dev_admin", "email": "admin@example.com"}
        raise HTTPException(status_code=401, detail="Not authenticated")

    if not settings.is_clerk_configured:
        if settings.ENVIRONMENT == "development":
            return {"sub": "dev_admin", "email": "admin@example.com"}
        raise HTTPException(status_code=501, detail="Clerk not configured")

    payload = await verify_clerk_token(credentials.credentials)
    user_id = payload.get("sub", "")
    email = payload.get("email", "")

    from db.queries import get_or_create_user, is_user_admin
    await get_or_create_user(user_id, email)

    if await is_user_admin(user_id):
        return payload

    raise HTTPException(status_code=403, detail="Not authorized as admin")
