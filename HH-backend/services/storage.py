import boto3
import os
import base64
import logging
from pathlib import Path
from config import settings

logger = logging.getLogger("hh-backend.storage")

_s3_client = None


def get_s3_client():
    global _s3_client
    if _s3_client is None and settings.is_r2_configured:
        _s3_client = boto3.client(
            "s3",
            endpoint_url=f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
            aws_access_key_id=settings.R2_ACCESS_KEY_ID,
            aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
            region_name="auto",
        )
    return _s3_client


def _decode_data_url(data_url: str) -> tuple[bytes, str]:
    if data_url.startswith("data:"):
        header, encoded = data_url.split(",", 1)
        mime = header.split(":")[1].split(";")[0]
        return base64.b64decode(encoded), mime
    return base64.b64decode(data_url), "image/png"


def _ensure_upload_dir():
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    return upload_dir


async def upload_image(data_url: str, slug: str) -> tuple[str, str]:
    image_bytes, mime = _decode_data_url(data_url)
    ext = "png" if "png" in mime else "jpg" if "jpeg" in mime or "jpg" in mime else "webp"
    r2_key = f"cards/{slug}.{ext}"

    if settings.is_r2_configured:
        try:
            s3 = get_s3_client()
            content_type = f"image/{ext}"
            s3.put_object(
                Bucket=settings.R2_BUCKET_NAME,
                Key=r2_key,
                Body=image_bytes,
                ContentType=content_type,
            )
            public_url = f"{settings.R2_PUBLIC_URL}/{r2_key}"
            logger.info(f"Uploaded to R2: {r2_key}")
            return public_url, "r2"
        except Exception as e:
            logger.error(f"R2 upload failed, falling back to local: {e}")

    upload_dir = _ensure_upload_dir()
    file_path = upload_dir / f"{slug}.{ext}"
    file_path.write_bytes(image_bytes)
    local_url = f"/uploads/{slug}.{ext}"
    logger.info(f"Saved locally: {file_path}")
    return local_url, "local"


async def get_image_url(image_url: str, storage_type: str = "local") -> str:
    if storage_type == "r2" and settings.is_r2_configured:
        return image_url
    return image_url


async def delete_image(slug: str) -> bool:
    if settings.is_r2_configured:
        try:
            s3 = get_s3_client()
            for ext in ["png", "jpg", "webp"]:
                s3.delete_object(
                    Bucket=settings.R2_BUCKET_NAME,
                    Key=f"cards/{slug}.{ext}",
                )
            return True
        except Exception as e:
            logger.error(f"R2 delete failed: {e}")

    upload_dir = Path(settings.UPLOAD_DIR)
    for ext in ["png", "jpg", "webp"]:
        file_path = upload_dir / f"{slug}.{ext}"
        if file_path.exists():
            file_path.unlink()
            return True
    return False
