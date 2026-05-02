from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.rsvp import RSVP


async def get_by_id(db: AsyncSession, rsvp_id: str) -> RSVP | None:
    result = await db.execute(select(RSVP).where(RSVP.id == rsvp_id))
    return result.scalar_one_or_none()


async def get_by_user_event(
    db: AsyncSession, user_id: str, event_id: str
) -> RSVP | None:
    result = await db.execute(
        select(RSVP).where(
            RSVP.user_id == user_id,
            RSVP.event_id == event_id,
        )
    )
    return result.scalar_one_or_none()


async def create_with_lock(
    db: AsyncSession,
    user_id: str,
    event_id: str,
    capacity: int,
) -> RSVP | None:
    """
    Attempt RSVP creation inside a row-locked transaction.
    Returns the new RSVP, or None if at capacity or duplicate.
    """
    # Lock the event row to prevent race conditions
    await db.execute(
        text("SELECT id FROM events WHERE id = :eid FOR UPDATE"),
        {"eid": event_id},
    )

    from sqlalchemy import func
    rsvp_count_result = await db.execute(
        select(func.count(RSVP.id)).where(RSVP.event_id == event_id)
    )
    if rsvp_count_result.scalar_one() >= capacity:
        return None

    existing = await get_by_user_event(db, user_id, event_id)
    if existing:
        return None

    rsvp = RSVP(user_id=user_id, event_id=event_id)
    db.add(rsvp)
    await db.flush()
    await db.refresh(rsvp)
    return rsvp
