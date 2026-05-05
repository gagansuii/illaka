from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint, func, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, generate_uuid


class Follow(Base):
    """
    Social graph edge: follower → following.
    Index on both directions so fan-out reads are fast.
    """
    __tablename__ = "follows"
    __table_args__ = (
        UniqueConstraint("follower_id", "following_id", name="uq_follow_pair"),
        Index("ix_follows_follower_id", "follower_id"),
        Index("ix_follows_following_id", "following_id"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    follower_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    following_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    follower: Mapped["User"] = relationship(  # noqa: F821
        "User", back_populates="following", foreign_keys=[follower_id]
    )
    following: Mapped["User"] = relationship(  # noqa: F821
        "User", back_populates="followers", foreign_keys=[following_id]
    )
