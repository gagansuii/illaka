from fastapi import APIRouter, Depends, Header, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, get_current_user_optional
from app.caching.redis_client import cache
from app.core.exceptions import RateLimitError
from app.database.session import get_db
from app.models.user import User
from app.repositories import event_repo
from app.schemas.event import (
    CreateEventRequest,
    EventListResponse,
    UpdateEventRequest,
)
from app.services import event_service, rsvp_service

router = APIRouter(prefix="/events", tags=["events"])


@router.get("", response_model=EventListResponse)
async def list_events(
    lat: float = Query(...),
    lng: float = Query(...),
    radius: float = Query(default=10000, ge=500),
    request: Request = None,
    db: AsyncSession = Depends(get_db),
):
    import math
    lat_key = f"{math.floor(lat * 100)}"
    lng_key = f"{math.floor(lng * 100)}"
    if not await cache.rate_limit(f"events:{lat_key}:{lng_key}", limit=120, window=60):
        raise RateLimitError("Too many requests")

    events = await event_service.get_feed(db, lat, lng, radius)
    return {"events": events}


@router.post("", status_code=201)
async def create_event(
    body: CreateEventRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not await cache.rate_limit(f"create_event:{current_user.id}", limit=10, window=60):
        raise RateLimitError("Too many requests")

    event = await event_service.create_event(db, current_user.id, body.model_dump())
    return {"event": event}


@router.get("/mine")
async def my_events(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    events = await event_repo.list_by_organizer(db, current_user.id)
    result = []
    for e in events:
        rsvp_count = await event_repo.get_rsvp_count(db, e.id)
        result.append(
            {
                "id": e.id,
                "title": e.title,
                "start_time": e.start_time.isoformat(),
                "end_time": e.end_time.isoformat(),
                "capacity": e.capacity,
                "rsvp_count": rsvp_count,
                "visibility": e.visibility.value,
                "engagement_score": e.engagement_score,
            }
        )
    return {"events": result}


@router.get("/{event_id}")
async def get_event(
    event_id: str,
    current_user: User | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
    x_share_token: str | None = Header(default=None, alias="x-share-token"),
):
    event = await event_service.get_event(db, event_id, current_user, x_share_token)
    return {"event": event}


@router.put("/{event_id}")
async def update_event(
    event_id: str,
    body: UpdateEventRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    updated = await event_service.update_event(
        db, event_id, current_user, body.model_dump(exclude_none=True)
    )
    return {"event": updated}


@router.delete("/{event_id}", status_code=200)
async def delete_event(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await event_service.delete_event(db, event_id, current_user)
    return {"ok": True}


@router.post("/{event_id}/rsvp", status_code=201)
async def rsvp_event(
    event_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    base_url = str(request.base_url).rstrip("/")
    result = await rsvp_service.create_rsvp(
        db=db,
        user_id=current_user.id,
        event_id=event_id,
        current_user_role=current_user.role,
        current_user_email=current_user.email,
        current_user_name=current_user.name,
        ticket_base_url=base_url,
    )
    return result


@router.post("/{event_id}/share", status_code=200)
async def share_event(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await rsvp_service.record_share(db, current_user.id, event_id)
    return {"ok": True}


@router.post("/{event_id}/invite", status_code=200)
async def generate_invite(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    token = await event_service.generate_invite_token(db, event_id, current_user)
    return {"token": token}
