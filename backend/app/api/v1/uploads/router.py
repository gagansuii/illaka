from fastapi import APIRouter, Depends, File, Form, Request, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.caching.redis_client import cache
from app.core.exceptions import ForbiddenError, RateLimitError
from app.database.session import get_db
from app.integrations.cloudinary_client import upload_file
from app.models.user import User, UserRole

router = APIRouter(prefix="/uploads", tags=["uploads"])

_ORGANIZER_FOLDERS = frozenset(["ilaka/payment-qr"])


@router.post("")
async def upload(
    file: UploadFile = File(...),
    folder: str = Form(...),
    request: Request = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not await cache.rate_limit(f"upload:{current_user.id}", limit=10, window=60):
        raise RateLimitError("Too many upload requests")

    if folder in _ORGANIZER_FOLDERS:
        if current_user.role not in (UserRole.ORGANIZER, UserRole.ADMIN):
            raise ForbiddenError("Only organizers can upload to this folder")

    data = await file.read()
    url = await upload_file(data, file.content_type, folder)
    return {"url": url}
