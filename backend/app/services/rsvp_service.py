import asyncio

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    AlreadyRSVPedError,
    CapacityFullError,
    ForbiddenError,
    NotFoundError,
)
from app.integrations.mailer import TicketEmailData, send_ticket_email
from app.models.event import EventVisibility
from app.models.share import Share
from app.models.user import UserRole
from app.repositories import event_repo, rsvp_repo


async def create_rsvp(
    db: AsyncSession,
    user_id: str,
    event_id: str,
    current_user_role: UserRole,
    current_user_email: str,
    current_user_name: str,
    ticket_base_url: str,
) -> dict:
    event = await event_repo.get_by_id(db, event_id)
    if not event:
        raise NotFoundError("Event not found")

    if event.visibility == EventVisibility.PRIVATE:
        if current_user_role != UserRole.ADMIN and event.organizer_id != user_id:
            raise ForbiddenError("Cannot RSVP to a private event")

    rsvp = await rsvp_repo.create_with_lock(db, user_id, event_id, event.capacity)
    if rsvp is None:
        # Distinguish capacity-full vs duplicate
        existing = await rsvp_repo.get_by_user_event(db, user_id, event_id)
        if existing:
            raise AlreadyRSVPedError()
        raise CapacityFullError()

    await event_repo.recalc_engagement(db, event_id)
    from app.caching.events_cache import events_cache
    await events_cache.clear()

    # Award XP for RSVPing (best-effort, non-blocking)
    asyncio.create_task(_award_rsvp_xp(db, user_id, rsvp.id))

    # Non-blocking ticket email
    ticket_url = f"{ticket_base_url}/tickets/{rsvp.id}"
    email_data = TicketEmailData(
        to=current_user_email,
        ticket_id=rsvp.ticket_id,
        rsvp_id=rsvp.id,
        event_title=event.title,
        event_start=event.start_time.strftime("%b %d, %Y %I:%M %p") if event.start_time else "",
        event_location=(
            event.online_link or "See event page for location"
            if event.event_type.value == "ONLINE"
            else "See event page for location"
        ),
        amount=int(event.ticket_price * 100) if event.is_paid and event.ticket_price else None,
        ticket_url=ticket_url,
    )
    asyncio.create_task(send_ticket_email(email_data))

    return {"ok": True, "rsvp_id": rsvp.id}


async def _award_rsvp_xp(db: AsyncSession, user_id: str, rsvp_id: str) -> None:
    try:
        from app.services.gamification_service import award_xp
        from app.models.gamification.xp_log import XPAction
        await award_xp(db, user_id, XPAction.RSVP_EVENT, ref_id=rsvp_id)
        await db.commit()
    except Exception:
        pass


async def record_share(
    db: AsyncSession,
    user_id: str,
    event_id: str,
) -> None:
    event = await event_repo.get_by_id(db, event_id)
    if not event:
        raise NotFoundError("Event not found")

    from sqlalchemy import select
    existing = await db.execute(
        select(Share).where(Share.user_id == user_id, Share.event_id == event_id)
    )
    if not existing.scalar_one_or_none():
        share = Share(user_id=user_id, event_id=event_id)
        db.add(share)
        await db.flush()

    await event_repo.recalc_engagement(db, event_id)
    from app.caching.events_cache import events_cache
    await events_cache.clear()
