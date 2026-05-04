import enum

from geoalchemy2 import Geography
from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    Enum,
    Float,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, generate_uuid


class EventVisibility(str, enum.Enum):
    PUBLIC = "PUBLIC"
    PRIVATE = "PRIVATE"


class EventType(str, enum.Enum):
    PHYSICAL = "PHYSICAL"
    ONLINE = "ONLINE"


class LinkShareMode(str, enum.Enum):
    INVITE_ONLY = "INVITE_ONLY"
    PUBLIC = "PUBLIC"


class Event(Base, TimestampMixin):
    __tablename__ = "events"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=generate_uuid
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    banner_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    badge_icon: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Location
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    location: Mapped[object | None] = mapped_column(
        Geography(geometry_type="POINT", srid=4326), nullable=True
    )

    # Timing
    start_time: Mapped[object] = mapped_column(DateTime(timezone=True), nullable=False)
    end_time: Mapped[object] = mapped_column(DateTime(timezone=True), nullable=False)

    # Settings
    visibility: Mapped[EventVisibility] = mapped_column(
        Enum(EventVisibility), default=EventVisibility.PUBLIC, nullable=False
    )
    capacity: Mapped[int] = mapped_column(Integer, nullable=False)
    organizer_id: Mapped[str] = mapped_column(
        String, nullable=False, index=True
    )

    # Ticket / payment
    is_paid: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    ticket_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    payment_qr_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Engagement
    engagement_score: Mapped[int] = mapped_column(Integer, default=0, nullable=False, index=True)

    # Venue address (human-readable, for physical events)
    address: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Sharing
    share_token: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)

    # Online events
    event_type: Mapped[EventType] = mapped_column(
        Enum(EventType), default=EventType.PHYSICAL, nullable=False
    )
    online_link: Mapped[str | None] = mapped_column(String(500), nullable=True)
    link_share_mode: Mapped[LinkShareMode] = mapped_column(
        Enum(LinkShareMode), default=LinkShareMode.INVITE_ONLY, nullable=False
    )

    # Relationships
    organizer: Mapped["User"] = relationship(  # noqa: F821
        "User", back_populates="organized_events", foreign_keys=[organizer_id]
    )
    rsvps: Mapped[list["RSVP"]] = relationship(  # noqa: F821
        "RSVP", back_populates="event", cascade="all, delete-orphan"
    )
    likes: Mapped[list["Like"]] = relationship(  # noqa: F821
        "Like", back_populates="event", cascade="all, delete-orphan"
    )
    shares: Mapped[list["Share"]] = relationship(  # noqa: F821
        "Share", back_populates="event", cascade="all, delete-orphan"
    )
    attendances: Mapped[list["Attendance"]] = relationship(  # noqa: F821
        "Attendance", back_populates="event", cascade="all, delete-orphan"
    )
    payments: Mapped[list["Payment"]] = relationship(  # noqa: F821
        "Payment", back_populates="event"
    )
    reminder_logs: Mapped[list["ReminderLog"]] = relationship(  # noqa: F821
        "ReminderLog", back_populates="event", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("idx_events_location", "location", postgresql_using="gist"),
        Index("idx_events_start_time", "start_time"),
        Index("idx_events_visibility", "visibility"),
        Index("idx_events_engagement", "engagement_score"),
    )
