"""
Celery tasks for notification delivery.
Heavy paths: FCM push, email delivery, bulk reminders.
"""
import logging
from datetime import datetime, timedelta, timezone

from celery import shared_task

logger = logging.getLogger(__name__)


def _get_sync_session():
    """Create a synchronous SQLAlchemy session for Celery (sync) workers."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from app.core.config import settings
    # Celery workers use sync engine — strip asyncpg driver
    sync_url = settings.DATABASE_URL.replace("+asyncpg", "")
    engine = create_engine(sync_url, pool_pre_ping=True)
    Session = sessionmaker(bind=engine)
    return Session()


@shared_task(
    name="app.workers.notification_tasks.send_event_reminders",
    bind=True,
    max_retries=3,
    default_retry_delay=60,
)
def send_event_reminders(self):
    """
    Send 3 reminder windows:
      - 6h before  → PHYSICAL events
      - 1h before  → PHYSICAL + ONLINE
      - 1d before  → ONLINE events
    Idempotent via reminder_logs unique constraint.
    """
    from sqlalchemy import select
    from app.models.event import Event
    from app.models.rsvp import RSVP
    from app.models.reminder_log import ReminderLog, ReminderType
    from app.models.user import User
    from app.integrations.mailer import send_reminder_email_sync

    now = datetime.now(timezone.utc)
    buffer = timedelta(minutes=5)
    windows = [
        (ReminderType.h6, timedelta(hours=6), ["PHYSICAL"]),
        (ReminderType.h1, timedelta(hours=1), ["PHYSICAL", "ONLINE"]),
        (ReminderType.d1, timedelta(days=1), ["ONLINE"]),
    ]

    session = _get_sync_session()
    try:
        for reminder_type, delta, event_types in windows:
            window_start = now + delta - buffer
            window_end = now + delta + buffer

            events = session.execute(
                select(Event).where(
                    Event.start_time.between(window_start, window_end),
                    Event.event_type.in_(event_types),
                )
            ).scalars().all()

            for event in events:
                rsvps = session.execute(
                    select(RSVP).where(RSVP.event_id == event.id)
                ).scalars().all()

                for rsvp in rsvps:
                    # Idempotency check
                    existing = session.execute(
                        select(ReminderLog).where(
                            ReminderLog.event_id == event.id,
                            ReminderLog.user_id == rsvp.user_id,
                            ReminderLog.type == reminder_type,
                        )
                    ).scalar_one_or_none()
                    if existing:
                        continue

                    user = session.get(User, rsvp.user_id)
                    if not user or not user.email:
                        continue

                    try:
                        send_reminder_email_sync(
                            to=user.email,
                            user_name=user.name,
                            event_title=event.title,
                            event_date=event.start_time.strftime("%a, %d %b %Y %H:%M"),
                            event_type=event.event_type,
                            online_link=getattr(event, "online_link", None),
                        )
                        session.add(ReminderLog(
                            event_id=event.id,
                            user_id=rsvp.user_id,
                            type=reminder_type,
                        ))
                        session.commit()
                    except Exception as exc:
                        logger.error("Reminder email failed: event=%s user=%s: %s", event.id, rsvp.user_id, exc)

        session.commit()
    except Exception as exc:
        session.rollback()
        logger.exception("send_event_reminders failed: %s", exc)
        raise self.retry(exc=exc)
    finally:
        session.close()


@shared_task(
    name="app.workers.notification_tasks.send_push_notification",
    bind=True,
    max_retries=3,
    default_retry_delay=30,
    queue="notifications",
)
def send_push_notification(self, user_id: str, title: str, body: str, data: dict):
    """
    Send Firebase Cloud Messaging push notification.
    Requires FCM_SERVER_KEY env var and user's fcm_token stored in DB.
    """
    import os
    import httpx

    fcm_key = os.environ.get("FCM_SERVER_KEY")
    if not fcm_key:
        return

    session = _get_sync_session()
    try:
        from app.models.user import User
        from sqlalchemy import select
        # fcm_token would be a new User field added in a later migration
        user = session.execute(select(User).where(User.id == user_id)).scalar_one_or_none()
        fcm_token = getattr(user, "fcm_token", None) if user else None
        if not fcm_token:
            return

        resp = httpx.post(
            "https://fcm.googleapis.com/fcm/send",
            headers={"Authorization": f"key={fcm_key}", "Content-Type": "application/json"},
            json={
                "to": fcm_token,
                "notification": {"title": title, "body": body},
                "data": data,
            },
            timeout=10,
        )
        if resp.status_code >= 400:
            raise Exception(f"FCM error {resp.status_code}: {resp.text}")
    except Exception as exc:
        logger.error("FCM push failed for user %s: %s", user_id, exc)
        raise self.retry(exc=exc)
    finally:
        session.close()
