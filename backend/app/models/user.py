import enum

from sqlalchemy import Boolean, Enum, Float, Integer, String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, generate_uuid


class UserRole(str, enum.Enum):
    USER = "USER"
    ORGANIZER = "ORGANIZER"
    ADMIN = "ADMIN"


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.USER, nullable=False)

    # ── Location ──────────────────────────────────────────────────────────────
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    radius_preference: Mapped[int] = mapped_column(Integer, default=5000, nullable=False)

    # ── Subscription / Billing ────────────────────────────────────────────────
    subscription_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    stripe_customer_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # ── Social Profile (NEW) ──────────────────────────────────────────────────
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    # JSON array of interest strings: ["music", "tech", "hiking"]
    interests: Mapped[list | None] = mapped_column(JSON, nullable=True)
    # JSON dict: {"twitter": "handle", "instagram": "handle", "website": "url"}
    social_links: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    location_label: Mapped[str | None] = mapped_column(String(200), nullable=True)

    # ── Gamification (NEW) ────────────────────────────────────────────────────
    xp: Mapped[int] = mapped_column(Integer, default=0, nullable=False, index=True)
    level: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    streak_days: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # ── Auth / Verification ───────────────────────────────────────────────────
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # ── Moderation (NEW) ──────────────────────────────────────────────────────
    is_shadow_banned: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # ── Relationships (existing) ──────────────────────────────────────────────
    organized_events: Mapped[list["Event"]] = relationship(  # noqa: F821
        "Event", back_populates="organizer", lazy="select"
    )
    rsvps: Mapped[list["RSVP"]] = relationship(  # noqa: F821
        "RSVP", back_populates="user", lazy="select"
    )
    likes: Mapped[list["Like"]] = relationship(  # noqa: F821
        "Like", back_populates="user", lazy="select"
    )
    shares: Mapped[list["Share"]] = relationship(  # noqa: F821
        "Share", back_populates="user", lazy="select"
    )
    attendances: Mapped[list["Attendance"]] = relationship(  # noqa: F821
        "Attendance", back_populates="user", lazy="select"
    )
    payments: Mapped[list["Payment"]] = relationship(  # noqa: F821
        "Payment", back_populates="user", lazy="select"
    )
    subscriptions: Mapped[list["Subscription"]] = relationship(  # noqa: F821
        "Subscription", back_populates="user", lazy="select"
    )
    password_reset_tokens: Mapped[list["PasswordResetToken"]] = relationship(  # noqa: F821
        "PasswordResetToken", back_populates="user", lazy="select"
    )
    reminder_logs: Mapped[list["ReminderLog"]] = relationship(  # noqa: F821
        "ReminderLog", back_populates="user", lazy="select"
    )

    # ── Relationships (NEW community) ─────────────────────────────────────────
    posts: Mapped[list["Post"]] = relationship(  # noqa: F821
        "Post", back_populates="author", lazy="select", foreign_keys="Post.author_id"
    )
    following: Mapped[list["Follow"]] = relationship(  # noqa: F821
        "Follow", back_populates="follower", foreign_keys="Follow.follower_id", lazy="select"
    )
    followers: Mapped[list["Follow"]] = relationship(  # noqa: F821
        "Follow", back_populates="following", foreign_keys="Follow.following_id", lazy="select"
    )
    notifications: Mapped[list["Notification"]] = relationship(  # noqa: F821
        "Notification", back_populates="recipient", foreign_keys="Notification.recipient_id", lazy="select"
    )
    xp_logs: Mapped[list["XPLog"]] = relationship(  # noqa: F821
        "XPLog", back_populates="user", lazy="select"
    )
    user_achievements: Mapped[list["UserAchievement"]] = relationship(  # noqa: F821
        "UserAchievement", back_populates="user", lazy="select"
    )
