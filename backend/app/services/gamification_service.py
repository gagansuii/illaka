"""
Gamification service — XP, levels, streaks, achievements.
All XP mutations are atomic: we update users.xp in the same transaction as the XPLog insert.
"""
import logging
import math
from datetime import date, datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.gamification.xp_log import XPLog, XPAction, XP_VALUES, level_from_xp
from app.models.gamification.achievement import Achievement, UserAchievement, ACHIEVEMENT_CATALOGUE
from app.models.gamification.streak import Streak
from app.models.user import User
from app.schemas.gamification import GamificationProfile, StreakResponse, AchievementResponse, XPLogResponse

logger = logging.getLogger(__name__)


async def award_xp(
    db: AsyncSession,
    user_id: str,
    action: XPAction,
    ref_id: str | None = None,
    override_points: int | None = None,
) -> tuple[int, bool]:
    """
    Award XP for an action. Returns (new_xp, leveled_up).
    override_points is only used for ADMIN_GRANT/ADMIN_DEDUCT.
    """
    points = override_points if override_points is not None else XP_VALUES.get(action, 0)
    if points == 0 and action not in (XPAction.ADMIN_GRANT, XPAction.ADMIN_DEDUCT):
        return 0, False

    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        return 0, False

    old_level = level_from_xp(user.xp)
    new_xp = max(0, user.xp + points)
    new_level = level_from_xp(new_xp)
    leveled_up = new_level > old_level

    user.xp = new_xp
    user.level = new_level

    db.add(XPLog(user_id=user_id, action=action, points=points, ref_id=ref_id))
    await db.flush()

    if leveled_up:
        from app.services.notification_service import create_notification
        from app.models.notification.notification import NotificationType
        await create_notification(
            db,
            recipient_id=user_id,
            notification_type=NotificationType.LEVEL_UP,
            title=f"You reached level {new_level}!",
            data={"level": new_level, "xp": new_xp},
        )

    return new_xp, leveled_up


async def check_and_update_streak(db: AsyncSession, user_id: str) -> StreakResponse:
    """Call on daily login / check-in."""
    today = date.today()

    streak = (
        await db.execute(select(Streak).where(Streak.user_id == user_id))
    ).scalar_one_or_none()

    if not streak:
        streak = Streak(user_id=user_id, current_streak=1, longest_streak=1, last_check_in=today)
        db.add(streak)
    else:
        if streak.last_check_in == today:
            pass  # Already checked in today
        elif streak.last_check_in and (today - streak.last_check_in).days == 1:
            streak.current_streak += 1
            streak.longest_streak = max(streak.longest_streak, streak.current_streak)
            if streak.current_streak % 7 == 0:
                await award_xp(db, user_id, XPAction.STREAK_BONUS, ref_id=f"streak_{streak.current_streak}")
        else:
            streak.current_streak = 1  # Streak broken
        streak.last_check_in = today

    # Update denormalized field on User
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if user:
        user.streak_days = streak.current_streak

    await db.flush()

    return StreakResponse(
        current_streak=streak.current_streak,
        longest_streak=streak.longest_streak,
        last_check_in=streak.last_check_in,
    )


async def check_achievements(db: AsyncSession, user_id: str) -> list[str]:
    """
    Run criteria checks and unlock any newly earned achievements.
    Returns list of newly unlocked achievement slugs.
    """
    from app.models.attendance import Attendance
    from app.models.community.post import Post
    from app.models.community.follow import Follow
    from app.models.event import Event
    from sqlalchemy import func

    # Gather stats
    attend_count = await db.scalar(
        select(func.count()).where(Attendance.user_id == user_id)
    ) or 0
    host_count = await db.scalar(
        select(func.count()).where(Event.organizer_id == user_id)
    ) or 0
    follower_count = await db.scalar(
        select(func.count()).where(Follow.following_id == user_id)
    ) or 0
    post_count = await db.scalar(
        select(func.count()).where(Post.author_id == user_id, Post.is_deleted.is_(False))
    ) or 0
    streak = (await db.execute(select(Streak).where(Streak.user_id == user_id))).scalar_one_or_none()
    current_streak = streak.current_streak if streak else 0

    stats = {
        "attend_count": attend_count,
        "host_count": host_count,
        "follower_count": follower_count,
        "post_count": post_count,
        "streak": current_streak,
    }

    # Already unlocked
    unlocked_ids = set(
        (await db.execute(
            select(UserAchievement.achievement_id).where(UserAchievement.user_id == user_id)
        )).scalars().all()
    )

    newly_unlocked = []
    all_achievements = (await db.execute(select(Achievement))).scalars().all()

    for ach in all_achievements:
        if ach.id in unlocked_ids:
            continue
        if _criteria_met(ach.criteria, stats):
            ua = UserAchievement(user_id=user_id, achievement_id=ach.id)
            db.add(ua)
            await award_xp(db, user_id, XPAction.ADMIN_GRANT, ref_id=ach.id, override_points=ach.xp_reward)
            newly_unlocked.append(ach.slug)
            from app.services.notification_service import notify_achievement_unlocked
            await notify_achievement_unlocked(db, user_id, ach.name, ach.id)

    if newly_unlocked:
        await db.flush()

    return newly_unlocked


def _criteria_met(criteria: dict | None, stats: dict) -> bool:
    if not criteria:
        return False
    ctype = criteria.get("type")
    threshold = criteria.get("threshold", 0)
    mapping = {
        "attend_count": stats["attend_count"],
        "host_count": stats["host_count"],
        "follower_count": stats["follower_count"],
        "post_count": stats["post_count"],
        "streak": stats["streak"],
    }
    return mapping.get(ctype, 0) >= threshold


async def get_leaderboard(db: AsyncSession, limit: int = 50) -> list[dict]:
    result = await db.execute(
        select(User.id, User.name, User.avatar_url, User.xp, User.level)
        .where(User.is_active.is_(True), User.is_shadow_banned.is_(False))
        .order_by(User.xp.desc())
        .limit(limit)
    )
    rows = result.all()
    return [
        {"rank": i + 1, "user_id": r.id, "name": r.name, "avatar_url": r.avatar_url, "xp": r.xp, "level": r.level}
        for i, r in enumerate(rows)
    ]


async def get_profile(db: AsyncSession, user_id: str) -> GamificationProfile:
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("User not found")

    streak = (await db.execute(select(Streak).where(Streak.user_id == user_id))).scalar_one_or_none()
    streak_resp = StreakResponse(
        current_streak=streak.current_streak if streak else 0,
        longest_streak=streak.longest_streak if streak else 0,
        last_check_in=streak.last_check_in if streak else None,
    )

    # All achievements with unlock status
    all_ach = (await db.execute(select(Achievement))).scalars().all()
    unlocked_map = {
        ua.achievement_id: ua.created_at
        for ua in (await db.execute(
            select(UserAchievement).where(UserAchievement.user_id == user_id)
        )).scalars().all()
    }
    achievements = [
        AchievementResponse(
            id=a.id, slug=a.slug, name=a.name, description=a.description,
            tier=a.tier, icon_url=a.icon_url, xp_reward=a.xp_reward,
            unlocked=a.id in unlocked_map,
            unlocked_at=unlocked_map.get(a.id),
        )
        for a in all_ach
    ]

    recent_logs = (await db.execute(
        select(XPLog).where(XPLog.user_id == user_id)
        .order_by(XPLog.created_at.desc()).limit(10)
    )).scalars().all()
    xp_logs = [XPLogResponse(id=l.id, action=l.action, points=l.points, ref_id=l.ref_id, created_at=l.created_at) for l in recent_logs]

    current_level_xp = (user.level - 1) ** 2 * 100
    next_level_xp = user.level ** 2 * 100
    xp_to_next = max(0, next_level_xp - user.xp)

    return GamificationProfile(
        xp=user.xp,
        level=user.level,
        xp_to_next_level=xp_to_next,
        streak=streak_resp,
        achievements=achievements,
        recent_xp_logs=xp_logs,
    )
