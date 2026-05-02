from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, generate_uuid


class Share(Base, TimestampMixin):
    __tablename__ = "shares"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=generate_uuid
    )
    user_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    event_id: Mapped[str] = mapped_column(
        String, ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True
    )

    user: Mapped["User"] = relationship("User", back_populates="shares")  # noqa: F821
    event: Mapped["Event"] = relationship("Event", back_populates="shares")  # noqa: F821
