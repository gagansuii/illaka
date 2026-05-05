import enum

from sqlalchemy import Enum, ForeignKey, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, generate_uuid


class XPAction(str, enum.Enum):
    # Event engagement
    RSVP_EVENT = "RSVP_EVENT"               # +10
    ATTEND_EVENT = "ATTEND_EVENT"           # +25
    HOST_EVENT = "HOST_EVENT"               # +50
    # Social
    CREATE_POST = "CREATE_POST"             # +5
    RECEIVE_LIKE = "RECEIVE_LIKE"           # +2
    RECEIVE_COMMENT = "RECEIVE_COMMENT"     # +3
    FOLLOW_USER = "FOLLOW_USER"             # +2
    GAIN_FOLLOWER = "GAIN_FOLLOWER"         # +5
    # Daily
    DAILY_LOGIN = "DAILY_LOGIN"             # +3
    STREAK_BONUS = "STREAK_BONUS"           # +10 per week streak
    # Community
    JOIN_COMMUNITY = "JOIN_COMMUNITY"       # +5
    POST_IN_COMMUNITY = "POST_IN_COMMUNITY" # +5
    # Admin adjustment
    ADMIN_GRANT = "ADMIN_GRANT"
    ADMIN_DEDUCT = "ADMIN_DEDUCT"


XP_VALUES: dict[XPAction, int] = {
    XPAction.RSVP_EVENT: 10,
    XPAction.ATTEND_EVENT: 25,
    XPAction.HOST_EVENT: 50,
    XPAction.CREATE_POST: 5,
    XPAction.RECEIVE_LIKE: 2,
    XPAction.RECEIVE_COMMENT: 3,
    XPAction.FOLLOW_USER: 2,
    XPAction.GAIN_FOLLOWER: 5,
    XPAction.DAILY_LOGIN: 3,
    XPAction.STREAK_BONUS: 10,
    XPAction.JOIN_COMMUNITY: 5,
    XPAction.POST_IN_COMMUNITY: 5,
    XPAction.ADMIN_GRANT: 0,  # overridden at award time
    XPAction.ADMIN_DEDUCT: 0,
}


def level_from_xp(xp: int) -> int:
    """XP thresholds: level = floor(sqrt(xp / 100)) + 1 (capped at 50)."""
    import math
    return min(50, int(math.sqrt(max(0, xp) / 100)) + 1)


class XPLog(Base, TimestampMixin):
    __tablename__ = "xp_logs"
    __table_args__ = (
        Index("ix_xp_logs_user_id", "user_id"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    action: Mapped[XPAction] = mapped_column(Enum(XPAction), nullable=False)
    points: Mapped[int] = mapped_column(Integer, nullable=False)
    # Optional reference (event_id, post_id, etc.)
    ref_id: Mapped[str | None] = mapped_column(String, nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="xp_logs")  # noqa: F821
