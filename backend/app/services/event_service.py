import asyncio
import uuid
from datetime import datetime, timezone

from geoalchemy2.functions import ST_MakePoint, ST_SetSRID
from sqlalchemy import cast, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.caching.events_cache import events_cache
from app.core.exceptions import ForbiddenError, NotFoundError
from app.models.event import Event, EventVisibility
from app.models.user import User, UserRole
from app.repositories import event_repo
from app.utils.sanitize import sanitize_media_url


def _sanitize_event(event: Event) -> dict:
    d = {
        "id": event.id,
        "title": event.title,
        "description": event.description,
        "banner_url": sanitize_media_url(event.banner_url),
        "badge_icon": sanitize_media_url(event.badge_icon),
        "latitude": event.latitude,
        "longitude": event.longitude,
        "start_time": event.start_time.isoformat() if event.start_time else None,
        "end_time": event.end_time.isoformat() if event.end_time else None,
        "visibility": event.visibility.value if event.visibility else event.visibility,
        "capacity": event.capacity,
        "organizer_id": event.organizer_id,
        "is_paid": event.is_paid,
        "ticket_price": event.ticket_price,
        "payment_qr_url": sanitize_media_url(event.payment_qr_url),
        "engagement_score": event.engagement_score,
        "share_token": event.share_token,
        "event_type": event.event_type.value if event.event_type else event.event_type,
        "online_link": event.online_link,
        "link_share_mode": event.link_share_mode.value if event.link_share_mode else event.link_share_mode,
        "created_at": event.created_at.isoformat() if event.created_at else None,
        "updated_at": event.updated_at.isoformat() if event.updated_at else None,
    }
    return d


async def get_feed(
    db: AsyncSession, lat: float, lng: float, radius: float
) -> list[dict]:
    """Return geo-filtered event feed with stale-while-revalidate caching."""
    key = events_cache.make_key(lat, lng, radius)
    cached, is_stale = await events_cache.get(key)

    if cached is not None and not is_stale:
        return cached

    async def _fetch_and_cache():
        events = await event_repo.list_nearby(db, lat, lng, radius)
        result = [_sanitize_event(e) for e in events]
        await events_cache.set(key, result)
        return result

    if cached is not None and is_stale:
        # Return stale data immediately, refresh in background
        asyncio.create_task(_fetch_and_cache())
        return cached

    return await _fetch_and_cache()


async def create_event(
    db: AsyncSession,
    organizer_id: str,
    data: dict,
) -> dict:
    # Build PostGIS geography point
    lat = data["latitude"]
    lng = data["longitude"]

    event = Event(
        organizer_id=organizer_id,
        title=data["title"],
        description=data["description"],
        banner_url=sanitize_media_url(data.get("banner_url")),
        badge_icon=sanitize_media_url(data.get("badge_icon")),
        latitude=lat,
        longitude=lng,
        location=f"SRID=4326;POINT({lng} {lat})",
        start_time=_parse_dt(data["start_time"]),
        end_time=_parse_dt(data["end_time"]),
        visibility=data.get("visibility", "PUBLIC"),
        capacity=data["capacity"],
        is_paid=data.get("is_paid", False),
        ticket_price=data.get("ticket_price"),
        payment_qr_url=sanitize_media_url(data.get("payment_qr_url")),
        event_type=data.get("event_type", "PHYSICAL"),
        online_link=data.get("online_link"),
        link_share_mode=data.get("link_share_mode", "INVITE_ONLY"),
    )
    db.add(event)
    await db.flush()
    await db.refresh(event)
    await events_cache.clear()

    # Best-effort AI indexing (non-blocking)
    asyncio.create_task(_index_event_ai(event.id, event.title, event.description, lat, lng))

    return _sanitize_event(event)


async def _index_event_ai(
    event_id: str,
    title: str,
    description: str,
    lat: float,
    lng: float,
) -> None:
    from app.ai.embeddings import embed_text, is_ai_configured
    from app.ai.vector_search import upsert_event

    if not is_ai_configured():
        return
    try:
        text_input = f"{title}\n{description}"
        vector = await embed_text(text_input)
        await upsert_event(event_id, vector, lat, lng)
    except Exception:
        pass  # Non-critical


def _parse_dt(value: str) -> datetime:
    if not value.endswith("Z") and "+" not in value and len(value) == 16:
        value += ":00"
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return datetime.fromisoformat(value)


async def get_event(
    db: AsyncSession,
    event_id: str,
    current_user: User | None = None,
    share_token: str | None = None,
) -> dict:
    event = await event_repo.get_by_id(db, event_id)
    if not event:
        raise NotFoundError("Event not found")

    if event.visibility == EventVisibility.PRIVATE:
        if share_token and event.share_token == share_token:
            pass  # public via share token
        elif current_user and (
            current_user.id == event.organizer_id
            or current_user.role == UserRole.ADMIN
        ):
            pass  # organizer or admin
        else:
            raise ForbiddenError("This event is private")

    return _sanitize_event(event)


async def update_event(
    db: AsyncSession,
    event_id: str,
    current_user: User,
    data: dict,
) -> dict:
    event = await event_repo.get_by_id(db, event_id)
    if not event:
        raise NotFoundError("Event not found")
    if event.organizer_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise ForbiddenError("Not authorized to edit this event")

    update_fields = {k: v for k, v in data.items() if v is not None}
    if "banner_url" in update_fields:
        update_fields["banner_url"] = sanitize_media_url(update_fields["banner_url"])
    if "start_time" in update_fields:
        update_fields["start_time"] = _parse_dt(update_fields["start_time"])
    if "end_time" in update_fields:
        update_fields["end_time"] = _parse_dt(update_fields["end_time"])

    updated = await event_repo.update_fields(db, event_id, **update_fields)
    await events_cache.clear()
    return _sanitize_event(updated)


async def delete_event(
    db: AsyncSession,
    event_id: str,
    current_user: User,
) -> None:
    event = await event_repo.get_by_id(db, event_id)
    if not event:
        raise NotFoundError("Event not found")
    if event.organizer_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise ForbiddenError("Not authorized to delete this event")

    await event_repo.delete_event(db, event_id)
    await events_cache.clear()


async def generate_invite_token(
    db: AsyncSession,
    event_id: str,
    current_user: User,
) -> str:
    event = await event_repo.get_by_id(db, event_id)
    if not event:
        raise NotFoundError("Event not found")
    if event.organizer_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise ForbiddenError("Not authorized")

    if event.share_token:
        return event.share_token

    token = str(uuid.uuid4())
    await event_repo.update_fields(db, event_id, share_token=token)
    return token
