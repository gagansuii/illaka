import enum

from sqlalchemy import Boolean, Enum, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, generate_uuid


class UserRole(str, enum.Enum):
    USER = "USER"
    ORGANIZER = "ORGANIZER"
    ADMIN = "ADMIN"


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=generate_uuid
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole), default=UserRole.USER, nullable=False
    )

    # Location preferences
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    radius_preference: Mapped[int] = mapped_column(Integer, default=5000, nullable=False)

    # Subscription
    subscription_type: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Stripe customer ID
    stripe_customer_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Relationships
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
