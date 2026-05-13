"""
Cleanup background tasks — replaces the APScheduler cleanup job.
"""
import logging
from datetime import datetime, timedelta, timezone

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(name="app.workers.cleanup_tasks.cleanup_expired_events")
def cleanup_expired_events():
    from sqlalchemy import create_engine, delete
    from sqlalchemy.orm import sessionmaker
    from app.core.config import settings
    from app.models.event import Event

    retention_days = int(__import__("os").environ.get("RETENTION_DAYS", "30"))
    cutoff = datetime.now(timezone.utc) - timedelta(days=retention_days)

    sync_url = settings.DATABASE_URL.replace("+asyncpg", "")
    engine = create_engine(sync_url, pool_pre_ping=True)
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        result = session.execute(
            delete(Event).where(Event.end_time < cutoff).returning(Event.id)
        )
        deleted = result.rowcount
        session.commit()
        logger.info("Cleanup: deleted %d expired events (cutoff=%s)", deleted, cutoff.date())
    except Exception as exc:
        session.rollback()
        logger.exception("cleanup_expired_events failed: %s", exc)
    finally:
        session.close()
