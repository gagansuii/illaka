import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class ReminderType(str, enum.Enum):
    ONE_DAY = "1d"
    SIX_HOURS = "6h"
    ONE_HOUR = "1h"


class ReminderLog(Base):
    __tablename__ = "reminder_logs"

    event_id: Mapped[str] = mapped_column(
        String, ForeignKey("events.id", ondelete="CASCADE"), primary_key=True
    )
    user_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    type: Mapped[ReminderType] = mapped_column(
        Enum(ReminderType), primary_key=True
    )
    sent_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )

    event: Mapped["Event"] = relationship("Event", back_populates="reminder_logs")  # noqa: F821
    user: Mapped["User"] = relationship("User", back_populates="reminder_logs")  # noqa: F821
