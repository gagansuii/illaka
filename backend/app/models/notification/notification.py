import enum

from sqlalchemy import Boolean, Enum, ForeignKey, Index, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, generate_uuid


class NotificationType(str, enum.Enum):
    # Social
    NEW_FOLLOWER = "NEW_FOLLOWER"
    POST_LIKE = "POST_LIKE"
    POST_COMMENT = "POST_COMMENT"
    COMMENT_REPLY = "COMMENT_REPLY"
    POST_MENTION = "POST_MENTION"
    # Events
    EVENT_REMINDER = "EVENT_REMINDER"
    RSVP_CONFIRMED = "RSVP_CONFIRMED"
    EVENT_UPDATED = "EVENT_UPDATED"
    EVENT_CANCELLED = "EVENT_CANCELLED"
    # Community
    COMMUNITY_INVITE = "COMMUNITY_INVITE"
    COMMUNITY_POST = "COMMUNITY_POST"
    ORGANIZER_ANNOUNCEMENT = "ORGANIZER_ANNOUNCEMENT"
    # Payments
    PAYMENT_SUCCESS = "PAYMENT_SUCCESS"
    PAYMENT_FAILED = "PAYMENT_FAILED"
    # Gamification
    ACHIEVEMENT_UNLOCKED = "ACHIEVEMENT_UNLOCKED"
    LEVEL_UP = "LEVEL_UP"
    # Chat
    NEW_MESSAGE = "NEW_MESSAGE"


class Notification(Base, TimestampMixin):
    """
    Centralized notification record.
    Delivered in-app (WebSocket push) + optionally email/FCM via Celery.
    """
    __tablename__ = "notifications"
    __table_args__ = (
        # Primary read pattern: fetch unread for a user, newest first
        Index("ix_notifications_recipient_read", "recipient_id", "is_read", "created_at"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    recipient_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    # Optional: who triggered it
    actor_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    notification_type: Mapped[NotificationType] = mapped_column(
        Enum(NotificationType), nullable=False
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    body: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Arbitrary JSON payload for deep linking: {"event_id": "...", "post_id": "..."}
    data: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    # Tracks if we've sent the FCM/email for this notification
    is_pushed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    recipient: Mapped["User"] = relationship(  # noqa: F821
        "User", back_populates="notifications", foreign_keys=[recipient_id]
    )
    actor: Mapped["User | None"] = relationship(  # noqa: F821
        "User", foreign_keys=[actor_id]
    )
