from fastapi import APIRouter, Header
from sqlalchemy import text

from app.core.config import settings
from app.database.session import AsyncSessionLocal

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
async def health(authorization: str | None = Header(default=None)):
    # Open in dev; require HEALTH_SECRET or CRON_SECRET in production
    if settings.is_production:
        secret = settings.HEALTH_SECRET or settings.CRON_SECRET
        if secret:
            token = (authorization or "").removeprefix("Bearer ").strip()
            if token != secret:
                from app.core.exceptions import UnauthorizedError
                raise UnauthorizedError("Invalid health secret")

    try:
        async with AsyncSessionLocal() as db:
            await db.execute(text("SELECT 1"))
        return {"ok": True, "db": "connected"}
    except Exception as exc:
        from fastapi import status
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"ok": False, "db": "unreachable", "detail": str(exc)},
        )
