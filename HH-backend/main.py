import os
import sys
import logging
from pathlib import Path
from contextlib import asynccontextmanager
from datetime import datetime
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from config import settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)
logger = logging.getLogger("hh-backend")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Shoreline Backend...")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Database configured: {settings.is_db_configured}")
    logger.info(f"R2 configured: {settings.is_r2_configured}")
    logger.info(f"Clerk configured: {settings.is_clerk_configured}")
    logger.info(f"Gemini configured: {settings.is_gemini_configured}")

    if settings.is_db_configured:
        from db.connection import test_connection
        await test_connection()
        from db.migrate import run_migration
        run_migration()
        from db.seed import run_seed
        run_seed()

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    yield

    from db.connection import close_pool
    await close_pool()
    logger.info("Backend shutdown complete")


app = FastAPI(
    title="Shoreline API",
    description="Backend API for Shoreline Frame & Builder ID Card Generator",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8080",
    ] if settings.ENVIRONMENT == "development" else [
        settings.FRONTEND_URL,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── HEALTH CHECK (must be before SPA catch-all) ─────────────────────────────
@app.get("/api/health")
async def health_check():
    db_ok = False
    if settings.is_db_configured:
        try:
            from db.connection import test_connection
            db_ok = await test_connection()
        except Exception:
            db_ok = False
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "database": "connected" if db_ok else "not configured",
        "storage": "r2" if settings.is_r2_configured else "local",
    }


# ─── API ROUTERS (must be before SPA catch-all) ──────────────────────────────
from routers.cards import router as cards_router
from routers.title import router as title_router
from routers.admin import router as admin_router
from routers.auth import router as auth_router

app.include_router(cards_router)
app.include_router(title_router)
app.include_router(admin_router)
app.include_router(auth_router)


# ─── STATIC FILES (uploads for local storage) ─────────────────────────────────
if os.path.exists(settings.UPLOAD_DIR):
    app.mount(
        "/uploads",
        StaticFiles(directory=settings.UPLOAD_DIR),
        name="uploads",
    )


# ─── SPA CATCH-ALL (must be LAST) ────────────────────────────────────────────
dist_path = Path(__file__).parent.parent / "HH-frontend" / "dist"
if dist_path.exists():
    assets_path = dist_path / "assets"
    if assets_path.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_path)), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = dist_path / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(dist_path / "index.html"))
else:
    @app.get("/")
    async def root():
        return {"message": "Shoreline API is running. Frontend not built yet. Visit /docs for API docs."}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.ENVIRONMENT == "development",
        log_level="info",
    )
