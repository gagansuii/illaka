import uuid
from typing import Any

import cloudinary
import cloudinary.uploader

from app.core.config import settings
from app.core.exceptions import ServiceUnavailableError, ValidationError

ALLOWED_FOLDERS = frozenset(["ilaka/banners", "ilaka/badges", "ilaka/payment-qr"])
ALLOWED_MIME = frozenset(["image/jpeg", "image/png", "image/webp", "image/gif"])
MAX_FILE_SIZE = 5 * 1024 * 1024   # 5 MB
MIN_FILE_SIZE = 100                 # bytes

# Magic byte signatures for server-side content validation
_MAGIC = {
    b"\xff\xd8\xff": "image/jpeg",
    b"\x89PNG\r\n\x1a\n": "image/png",
    b"GIF8": "image/gif",
}


def _detect_mime(data: bytes) -> str | None:
    for magic, mime in _MAGIC.items():
        if data[: len(magic)] == magic:
            return mime
    # WebP: RIFF????WEBP
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    return None


def _configure() -> None:
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )


async def upload_file(
    data: bytes,
    claimed_mime: str,
    folder: str,
) -> str:
    if not settings.cloudinary_configured:
        raise ServiceUnavailableError("Upload service not configured")

    if folder not in ALLOWED_FOLDERS:
        raise ValidationError(f"Invalid upload folder: {folder}")

    if len(data) < MIN_FILE_SIZE:
        raise ValidationError("File too small")
    if len(data) > MAX_FILE_SIZE:
        raise ValidationError("File exceeds 5 MB limit")

    if claimed_mime not in ALLOWED_MIME:
        raise ValidationError("Unsupported file type")

    actual_mime = _detect_mime(data)
    if actual_mime is None or actual_mime != claimed_mime:
        raise ValidationError("File content does not match claimed type")

    _configure()
    public_id = f"{folder}/{uuid.uuid4()}"

    try:
        result: dict[str, Any] = cloudinary.uploader.upload(
            data,
            public_id=public_id,
            resource_type="image",
            overwrite=False,
        )
        return result["secure_url"]
    except Exception as exc:
        raise ServiceUnavailableError(f"Upload failed: {exc}") from exc
