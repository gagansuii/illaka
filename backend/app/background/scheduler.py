"""
APScheduler-based cron system.
Replaces the Next.js /api/cron/* routes.
Registered at application startup.
"""
import logging
from datetime import datetime, timedelta, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler(timezone="UTC")


async def run_reminders() -> dict:
    """
    Send event reminders for 6h, 1h (physical+online), 1d windows.
    Exactly mirrors the original /api/cron/reminders logic.
    """
    from app.database.session import AsyncSessionLocal
    from app.integrations.mailer import send_reminder_email
    from app.models.event import EventType
    from app.models.reminder_log import ReminderLog, ReminderType
    from sqlalchemy import select
    from app.models.event import Event
    from app.models.rsvp import RSVP

    BUFFER = timedelta(minutes=5)
    now = datetime.now(timezone.utc)

    windows = [
        {
            "type": ReminderType.SIX_HOURS,
            "label": "6h",
            "low": now + timedelta(hours=6) - BUFFER,
            "high": now + timedelta(hours=6) + BUFFER,
            "event_types": [EventType.PHYSICAL],
        },
        {
            "type": ReminderType.ONE_HOUR,
            "label": "1h",
            "low": now + timedelta(hours=1) - BUFFER,
            "high": now + timedelta(hours=1) + BUFFER,
            "event_types": [EventType.PHYSICAL, EventType.ONLINE],
        },
        {
            "type": ReminderType.ONE_DAY,
            "label": "1d",
            "low": now + timedelta(days=1) - BUFFER,
            "high": now + timedelta(days=1) + BUFFER,
            "event_types": [EventType.ONLINE],
        },
    ]

    results = {}
    async with AsyncSessionLocal() as db:
        for window in windows:
            sent = skipped = errors = 0
            events = (
                await db.execute(
                    select(Event).where(
                        Event.start_time >= window["low"],
                        Event.start_time <= window["high"],
                        Event.event_type.in_(window["event_types"]),
                    )
                )
            ).scalars().all()

            for event in events:
                rsvps = (
                    await db.execute(
                        select(RSVP).where(RSVP.event_id == event.id)
                    )
                ).scalars().all()

                for rsvp in rsvps:
                    # Check deduplication
                    existing = (
                        await db.execute(
                            select(ReminderLog).where(
                                ReminderLog.event_id == event.id,
                                ReminderLog.user_id == rsvp.user_id,
                                ReminderLog.type == window["type"],
                            )
                        )
                    ).scalar_one_or_none()

                    if existing:
                        skipped += 1
                        continue

                    try:
                        from app.models.user import User
                        user = (
                            await db.execute(select(User).where(User.id == rsvp.user_id))
                        ).scalar_one_or_none()
                        if not user:
                            continue

                        subject = f"Reminder: {event.title} starts in {window['label']}"
                        ok = await send_reminder_email(
                            to=user.email,
                            subject=subject,
                            event_title=event.title,
                            event_start=event.start_time.strftime("%b %d, %Y %I:%M %p"),
                            is_online=event.event_type == EventType.ONLINE,
                            online_link=event.online_link,
                        )
                        if ok:
                            log = ReminderLog(
                                event_id=event.id,
                                user_id=rsvp.user_id,
                                type=window["type"],
                                sent_at=now,
                            )
                            db.add(log)
                            sent += 1
                        else:
                            errors += 1
                    except Exception as exc:
                        logger.error("Reminder error: %s", exc)
                        errors += 1

            await db.commit()
            results[window["label"]] = {
                "sent": sent,
                "skipped": skipped,
                "errors": errors,
            }

    logger.info("Reminders: %s", results)
    return results


async def run_event_cleanup() -> dict:
    """Delete events older than 30 days."""
    from datetime import datetime, timedelta, timezone
    from app.caching.events_cache import events_cache
    from app.database.session import AsyncSessionLocal
    from app.repositories.event_repo import delete_old_events

    cutoff = datetime.now(timezone.utc) - timedelta(days=30)
    async with AsyncSessionLocal() as db:
        deleted = await delete_old_events(db, cutoff)
        await db.commit()

    if deleted:
        await events_cache.clear()

    logger.info("Event cleanup: deleted %d old events", deleted)
    return {"deleted": deleted, "cutoff": cutoff.isoformat()}


def start_scheduler() -> None:
    scheduler.add_job(
        run_reminders,
        CronTrigger(minute="*/15"),
        id="send_reminders",
        replace_existing=True,
        misfire_grace_time=300,
    )
    scheduler.add_job(
        run_event_cleanup,
        CronTrigger(hour=3, minute=0),
        id="cleanup_events",
        replace_existing=True,
        misfire_grace_time=600,
    )
    scheduler.start()
    logger.info("APScheduler started")


def stop_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)
