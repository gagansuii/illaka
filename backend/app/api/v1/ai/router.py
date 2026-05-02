from pydantic import BaseModel
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user_optional
from app.caching.redis_client import cache
from app.core.exceptions import RateLimitError, ValidationError
from app.database.session import get_db
from app.models.user import User
from app.services.ai_service import semantic_search

router = APIRouter(prefix="/ai", tags=["ai"])


class AISearchRequest(BaseModel):
    query: str
    latitude: float
    longitude: float
    radius: float = 10000


@router.post("/search")
async def ai_search(
    body: AISearchRequest,
    request: Request,
    current_user: User | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    if len(body.query.strip()) < 2:
        raise ValidationError("Query must be at least 2 characters")

    rate_key = f"ai:{current_user.id}" if current_user else f"ai:{request.client.host}"
    if not await cache.rate_limit(rate_key, limit=30, window=60):
        raise RateLimitError("Too many AI search requests")

    events = await semantic_search(
        db,
        query=body.query,
        latitude=body.latitude,
        longitude=body.longitude,
        radius=body.radius,
    )
    return {"events": events}
