from fastapi import APIRouter, Request
from app.caching.redis_client import cache
from app.core.exceptions import NotFoundError, RateLimitError, ServiceUnavailableError
from app.integrations.ipinfo import locate_ip

router = APIRouter(prefix="/geo", tags=["geo"])


@router.get("/ip")
async def geo_by_ip(request: Request):
    forwarded = request.headers.get("x-forwarded-for")
    ip = (forwarded.split(",")[0].strip() if forwarded else None) or (
        request.client.host if request.client else None
    )
    if not ip:
        from app.core.exceptions import ValidationError
        raise ValidationError("Could not determine client IP")

    if not await cache.rate_limit(f"geo:{ip}", limit=10, window=60):
        raise RateLimitError("Too many geo requests")

    location = await locate_ip(ip)
    if not location:
        raise NotFoundError("Could not determine location for this IP")

    return {
        "latitude": location.latitude,
        "longitude": location.longitude,
        "city": location.city,
        "region": location.region,
    }
