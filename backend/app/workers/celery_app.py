"""
Celery application.
Broker: Redis (REDIS_URL)
Backend: Redis (same instance, db 1)

Workers:
  celery -A app.workers.celery_app worker --loglevel=info -Q default,notifications,feed

Beat (periodic tasks):
  celery -A app.workers.celery_app beat --loglevel=info
"""
from celery import Celery
from celery.schedules import crontab

from app.core.config import settings

_broker = settings.REDIS_URL or "redis://localhost:6379/0"
_backend = _broker.replace("/0", "/1") if _broker.endswith("/0") else _broker + "/1"

celery_app = Celery(
    "ilaaka",
    broker=_broker,
    backend=_backend,
    include=[
        "app.workers.notification_tasks",
        "app.workers.feed_tasks",
        "app.workers.gamification_tasks",
        "app.workers.cleanup_tasks",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_routes={
        "app.workers.notification_tasks.*": {"queue": "notifications"},
        "app.workers.feed_tasks.*": {"queue": "feed"},
        "app.workers.gamification_tasks.*": {"queue": "default"},
        "app.workers.cleanup_tasks.*": {"queue": "default"},
    },
    beat_schedule={
        # Send event reminders (replaces APScheduler)
        "send-reminders": {
            "task": "app.workers.notification_tasks.send_event_reminders",
            "schedule": crontab(minute="*/15"),
        },
        # Cleanup expired events (daily at 03:30 UTC)
        "cleanup-events": {
            "task": "app.workers.cleanup_tasks.cleanup_expired_events",
            "schedule": crontab(hour=3, minute=30),
        },
        # Recalculate trending feed scores (every 30 min)
        "recalc-trending": {
            "task": "app.workers.feed_tasks.recalculate_trending_scores",
            "schedule": crontab(minute="*/30"),
        },
        # Check and unlock achievements (hourly)
        "check-achievements": {
            "task": "app.workers.gamification_tasks.batch_check_achievements",
            "schedule": crontab(minute=0),
        },
    },
)
