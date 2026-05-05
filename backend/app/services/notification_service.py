"""
Notification service.
Write to DB + push to connected WebSocket clients via Redis pub/sub.
Heavy delivery (FCM / email) is delegated to Celery workers.
"""
import asyncio
import json
import logging
from typing import Any

from sqlalchemy import select, update, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification.notification import Notification, NotificationType
from app.models.user import User
from app.schemas.notification import NotificationResponse, NotificationPage

logger = logging.getLogger(__name__)


async def create_notification(
    db: AsyncSession,
    recipient_id: str,
    notification_type: NotificationType,
    title: str,
    body: str | None = None,
    actor_id: str | None = None,
    data: dict[str, Any] | None = None,
) -> Notification:
    notif = Notification(
        recipient_id=recipient_id,
        notification_type=notification_type,
        title=title,
        body=body,
        actor_id=actor_id,
        data=data or {},
    )
    db.add(notif)
    await db.flush()

    # Best-effort push over WebSocket via Redis pub/sub
    asyncio.create_task(_push_to_ws(recipient_id, notif))

    return notif


async def _push_to_ws(recipient_id: str, notif: Notification) -> None:
    """Publish notification to Redis so any WS server holding the connection picks it up."""
    try:
        from app.caching.redis_client import cache
        payload = json.dumps({
            "event": "notification",
            "data": {
                "id": notif.id,
                "type": notif.notification_type.value,
                "title": notif.title,
                "body": notif.body,
                "data": notif.data,
            },
        })
        r = await cache._get_redis()
        if r:
            await r.publish(f"user:{recipient_id}:notifications", payload)
    except Exception as exc:
        logger.warning("WS notification push failed: %s", exc)


async def get_notifications(
    db: AsyncSession,
    user_id: str,
    cursor: str | None,
    limit: int = 20,
) -> NotificationPage:
    from datetime import datetime

    unread_count = await db.scalar(
        select(func.count()).where(
            Notification.recipient_id == user_id,
            Notification.is_read.is_(False),
        )
    ) or 0

    q = (
        select(Notification)
        .options(selectinload(Notification.actor))
        .where(Notification.recipient_id == user_id)
        .order_by(Notification.created_at.desc())
        .limit(limit + 1)
    )
    if cursor:
        try:
            cursor_dt = datetime.fromisoformat(cursor)
            q = q.where(Notification.created_at < cursor_dt)
        except ValueError:
            pass

    rows = (await db.execute(q)).scalars().all()
    has_more = len(rows) > limit
    rows = rows[:limit]

    items = []
    for n in rows:
        actor_name = n.actor.name if n.actor else None
        actor_avatar = n.actor.avatar_url if n.actor else None
        items.append(NotificationResponse(
            id=n.id,
            notification_type=n.notification_type,
            title=n.title,
            body=n.body,
            data=n.data,
            actor_id=n.actor_id,
            actor_name=actor_name,
            actor_avatar=actor_avatar,
            is_read=n.is_read,
            created_at=n.created_at,
        ))

    next_cursor = rows[-1].created_at.isoformat() if (has_more and rows) else None

    return NotificationPage(
        notifications=items,
        unread_count=unread_count,
        next_cursor=next_cursor,
        has_more=has_more,
    )


async def mark_read(
    db: AsyncSession, user_id: str, notification_ids: list[str] | None
) -> int:
    q = (
        update(Notification)
        .where(
            Notification.recipient_id == user_id,
            Notification.is_read.is_(False),
        )
    )
    if notification_ids:
        q = q.where(Notification.id.in_(notification_ids))

    result = await db.execute(q.values(is_read=True))
    await db.flush()
    return result.rowcount


# ── Convenience helpers called by other services ──────────────────────────────

async def notify_new_follower(db: AsyncSession, actor_id: str, recipient_id: str) -> None:
    actor = (await db.execute(select(User).where(User.id == actor_id))).scalar_one_or_none()
    if not actor:
        return
    await create_notification(
        db,
        recipient_id=recipient_id,
        notification_type=NotificationType.NEW_FOLLOWER,
        title=f"{actor.name} started following you",
        actor_id=actor_id,
        data={"user_id": actor_id},
    )


async def notify_post_liked(
    db: AsyncSession, actor_id: str, post_author_id: str, post_id: str
) -> None:
    if actor_id == post_author_id:
        return
    actor = (await db.execute(select(User).where(User.id == actor_id))).scalar_one_or_none()
    if not actor:
        return
    await create_notification(
        db,
        recipient_id=post_author_id,
        notification_type=NotificationType.POST_LIKE,
        title=f"{actor.name} liked your post",
        actor_id=actor_id,
        data={"post_id": post_id},
    )


async def notify_post_comment(
    db: AsyncSession, actor_id: str, post_author_id: str, post_id: str
) -> None:
    if actor_id == post_author_id:
        return
    actor = (await db.execute(select(User).where(User.id == actor_id))).scalar_one_or_none()
    if not actor:
        return
    await create_notification(
        db,
        recipient_id=post_author_id,
        notification_type=NotificationType.POST_COMMENT,
        title=f"{actor.name} commented on your post",
        actor_id=actor_id,
        data={"post_id": post_id},
    )


async def notify_achievement_unlocked(
    db: AsyncSession, user_id: str, achievement_name: str, achievement_id: str
) -> None:
    await create_notification(
        db,
        recipient_id=user_id,
        notification_type=NotificationType.ACHIEVEMENT_UNLOCKED,
        title=f"Achievement unlocked: {achievement_name}!",
        body="Check your profile to see your new badge.",
        data={"achievement_id": achievement_id},
    )
