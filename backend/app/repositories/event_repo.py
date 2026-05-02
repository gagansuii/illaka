from datetime import datetime, timezone

from geoalchemy2.functions import ST_DWithin, ST_MakePoint, ST_SetSRID
from sqlalchemy import cast, delete, func, select, text, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.event import Event, EventVisibility
from app.models.rsvp import RSVP


async def get_by_id(db: AsyncSession, event_id: str) -> Event | None:
    result = await db.execute(select(Event).where(Event.id == event_id))
    return result.scalar_one_or_none()


async def get_by_share_token(db: AsyncSession, token: str) -> Event | None:
    result = await db.execute(
        select(Event).where(Event.share_token == token)
    )
    return result.scalar_one_or_none()


async def list_by_organizer(db: AsyncSession, organizer_id: str) -> list[Event]:
    result = await db.execute(
        select(Event)
        .where(Event.organizer_id == organizer_id)
        .order_by(Event.start_time.desc())
    )
    return list(result.scalars().all())


async def list_nearby(
    db: AsyncSession,
    lat: float,
    lng: float,
    radius_m: float,
    limit: int = 200,
) -> list[Event]:
    """Return public events within radius_m metres using PostGIS ST_DWithin."""
    point = ST_SetSRID(ST_MakePoint(lng, lat), 4326)
    result = await db.execute(
        select(Event)
        .where(
            Event.visibility == EventVisibility.PUBLIC,
            ST_DWithin(
                cast(Event.location, type_=Event.location.type),
                cast(point, type_=Event.location.type),
                radius_m,
            ),
        )
        .order_by(Event.engagement_score.desc())
        .limit(limit)
    )
    return list(result.scalars().all())


async def create(db: AsyncSession, organizer_id: str, **kwargs) -> Event:
    event = Event(organizer_id=organizer_id, **kwargs)
    db.add(event)
    await db.flush()
    await db.refresh(event)
    return event


async def update_fields(db: AsyncSession, event_id: str, **fields) -> Event | None:
    await db.execute(
        update(Event).where(Event.id == event_id).values(**fields)
    )
    return await get_by_id(db, event_id)


async def delete_event(db: AsyncSession, event_id: str) -> None:
    event = await get_by_id(db, event_id)
    if event:
        await db.delete(event)


async def recalc_engagement(db: AsyncSession, event_id: str) -> None:
    """
    Atomic engagement score update.
    engagementScore = (RSVPs × 3) + (Likes × 1) + (Shares × 5) + (Attendance × 10)
    """
    await db.execute(
        text(
            """
            UPDATE events SET engagement_score = (
                (SELECT COUNT(*) FROM rsvps    WHERE event_id = :eid) * 3  +
                (SELECT COUNT(*) FROM likes    WHERE event_id = :eid) * 1  +
                (SELECT COUNT(*) FROM shares   WHERE event_id = :eid) * 5  +
                (SELECT COUNT(*) FROM attendances WHERE event_id = :eid) * 10
            ) WHERE id = :eid
            """
        ),
        {"eid": event_id},
    )


async def get_rsvp_count(db: AsyncSession, event_id: str) -> int:
    result = await db.execute(
        select(func.count(RSVP.id)).where(RSVP.event_id == event_id)
    )
    return result.scalar_one()


async def list_paginated(
    db: AsyncSession, page: int = 0, page_size: int = 50
) -> tuple[list[Event], int]:
    events = (
        await db.execute(
            select(Event)
            .order_by(Event.created_at.desc())
            .offset(page * page_size)
            .limit(page_size)
        )
    ).scalars().all()
    total = (await db.execute(select(func.count(Event.id)))).scalar_one()
    return list(events), total


async def delete_old_events(db: AsyncSession, cutoff: datetime) -> int:
    result = await db.execute(
        delete(Event)
        .where(Event.end_time < cutoff)
        .returning(Event.id)
    )
    return len(result.all())
