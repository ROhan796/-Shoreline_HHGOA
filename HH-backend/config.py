from pydantic_settings import BaseSettings
import os


class Settings(BaseSettings):
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    ENVIRONMENT: str = "development"
    FRONTEND_URL: str = "http://localhost:5173"

    CLERK_PUBLISHABLE_KEY: str = ""
    CLERK_SECRET_KEY: str = ""

    DATABASE_URL: str = ""

    R2_ACCOUNT_ID: str = ""
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET_NAME: str = "hhgoa2026-cards"
    R2_PUBLIC_URL: str = ""

    GEMINI_API_KEY: str = ""

    UPLOAD_DIR: str = "./uploads"

    model_config = {"env_file": ".env", "extra": "ignore"}

    @property
    def is_r2_configured(self) -> bool:
        return bool(
            self.R2_ACCOUNT_ID
            and self.R2_ACCESS_KEY_ID
            and self.R2_SECRET_ACCESS_KEY
            and self.R2_BUCKET_NAME
        )

    @property
    def is_db_configured(self) -> bool:
        return bool(self.DATABASE_URL)

    @property
    def is_clerk_configured(self) -> bool:
        return bool(self.CLERK_SECRET_KEY and self.CLERK_PUBLISHABLE_KEY)

    @property
    def is_gemini_configured(self) -> bool:
        return bool(self.GEMINI_API_KEY)


settings = Settings()
