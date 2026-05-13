from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, generate_uuid


class RSVP(Base, TimestampMixin):
    __tablename__ = "rsvps"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=generate_uuid
    )
    ticket_id: Mapped[str] = mapped_column(
        String, unique=True, nullable=False, default=generate_uuid
    )
    user_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    event_id: Mapped[str] = mapped_column(
        String, ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True
    )

    user: Mapped["User"] = relationship("User", back_populates="rsvps")  # noqa: F821
    event: Mapped["Event"] = relationship("Event", back_populates="rsvps")  # noqa: F821

    __table_args__ = (
        UniqueConstraint("user_id", "event_id", name="uq_rsvp_user_event"),
    )
