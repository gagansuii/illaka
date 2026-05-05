from sqlalchemy import ForeignKey, Index, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, generate_uuid


class Bookmark(Base, TimestampMixin):
    __tablename__ = "bookmarks"
    __table_args__ = (
        UniqueConstraint("user_id", "post_id", name="uq_bookmark_user_post"),
        Index("ix_bookmarks_user_id", "user_id"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    post_id: Mapped[str] = mapped_column(
        String, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False
    )

    post: Mapped["Post"] = relationship("Post", back_populates="bookmarks")  # noqa: F821
    user: Mapped["User"] = relationship("User")  # noqa: F821
