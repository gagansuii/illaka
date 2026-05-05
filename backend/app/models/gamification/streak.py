from datetime import date

from sqlalchemy import Date, ForeignKey, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, generate_uuid


class Streak(Base, TimestampMixin):
    """
    Tracks daily login streaks.
    One row per user — updated on each daily check-in.
    """
    __tablename__ = "streaks"
    __table_args__ = (
        Index("ix_streaks_user_id", "user_id"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    current_streak: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    longest_streak: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_check_in: Mapped[date | None] = mapped_column(Date, nullable=True)

    user: Mapped["User"] = relationship("User")  # noqa: F821
