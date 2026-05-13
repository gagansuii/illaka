"""
Gamification background tasks.
"""
import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(name="app.workers.gamification_tasks.batch_check_achievements")
def batch_check_achievements():
    """
    Hourly: check achievement criteria for all active users who've had activity.
    Uses a sync session — asyncio not available in Celery by default.
    """
    from sqlalchemy import create_engine, select
    from sqlalchemy.orm import sessionmaker
    from app.core.config import settings
    from app.models.gamification.xp_log import XPLog
    from datetime import datetime, timedelta, timezone

    sync_url = settings.DATABASE_URL.replace("+asyncpg", "")
    engine = create_engine(sync_url, pool_pre_ping=True)
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        # Only users active in the last hour
        cutoff = datetime.now(timezone.utc) - timedelta(hours=1)
        active_user_ids = session.execute(
            select(XPLog.user_id).where(XPLog.created_at >= cutoff).distinct()
        ).scalars().all()

        for user_id in active_user_ids:
            try:
                _check_achievements_sync(session, user_id)
                session.commit()
            except Exception as exc:
                session.rollback()
                logger.error("Achievement check failed for user %s: %s", user_id, exc)

    finally:
        session.close()


def _check_achievements_sync(session, user_id: str):
    """Sync version of gamification_service.check_achievements."""
    from sqlalchemy import select, func
    from app.models.gamification.achievement import Achievement, UserAchievement, ACHIEVEMENT_CATALOGUE

    # Ensure catalogue is seeded
    for entry in ACHIEVEMENT_CATALOGUE:
        existing = session.execute(
            select(Achievement).where(Achievement.slug == entry["slug"])
        ).scalar_one_or_none()
        if not existing:
            from app.models.base import generate_uuid
            session.add(Achievement(
                id=generate_uuid(),
                slug=entry["slug"],
                name=entry["name"],
                description=entry["description"],
                tier=entry["tier"],
                xp_reward=entry["xp_reward"],
                criteria=_slug_to_criteria(entry["slug"]),
            ))
    session.flush()

    # Stats
    try:
        from app.models.attendance import Attendance
        attend_count = session.execute(
            select(func.count()).where(Attendance.user_id == user_id)
        ).scalar() or 0
    except Exception:
        attend_count = 0

    from app.models.event import Event
    from app.models.community.post import Post
    from app.models.community.follow import Follow

    host_count = session.execute(select(func.count()).where(Event.organizer_id == user_id)).scalar() or 0
    follower_count = session.execute(select(func.count()).where(Follow.following_id == user_id)).scalar() or 0
    post_count = session.execute(select(func.count()).where(Post.author_id == user_id, Post.is_deleted.is_(False))).scalar() or 0

    from app.models.gamification.streak import Streak
    streak = session.execute(select(Streak).where(Streak.user_id == user_id)).scalar_one_or_none()
    current_streak = streak.current_streak if streak else 0

    stats = {
        "attend_count": attend_count,
        "host_count": host_count,
        "follower_count": follower_count,
        "post_count": post_count,
        "streak": current_streak,
    }

    unlocked = set(
        session.execute(
            select(UserAchievement.achievement_id).where(UserAchievement.user_id == user_id)
        ).scalars().all()
    )

    for ach in session.execute(select(Achievement)).scalars().all():
        if ach.id in unlocked:
            continue
        from app.services.gamification_service import _criteria_met
        if _criteria_met(ach.criteria, stats):
            from app.models.base import generate_uuid
            session.add(UserAchievement(id=generate_uuid(), user_id=user_id, achievement_id=ach.id))
            # Award XP
            from app.models.user import User as UserModel
            user = session.get(UserModel, user_id)
            if user and ach.xp_reward:
                user.xp += ach.xp_reward
            logger.info("Achievement unlocked: user=%s slug=%s", user_id, ach.slug)


def _slug_to_criteria(slug: str) -> dict | None:
    mapping = {
        "first_event": {"type": "attend_count", "threshold": 1},
        "explorer_5": {"type": "attend_count", "threshold": 5},
        "adventurer_20": {"type": "attend_count", "threshold": 20},
        "legend_50": {"type": "attend_count", "threshold": 50},
        "first_host": {"type": "host_count", "threshold": 1},
        "builder_10": {"type": "host_count", "threshold": 10},
        "social_butterfly": {"type": "follower_count", "threshold": 10},
        "influencer_100": {"type": "follower_count", "threshold": 100},
        "community_voice": {"type": "post_count", "threshold": 10},
        "streak_7": {"type": "streak", "threshold": 7},
        "streak_30": {"type": "streak", "threshold": 30},
    }
    return mapping.get(slug)
