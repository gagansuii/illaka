from sqlalchemy import Boolean, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, generate_uuid


class Comment(Base, TimestampMixin):
    """
    Threaded comments on posts.
    parent_id = None → top-level comment.
    parent_id set → reply (max 1 level enforced at service layer).
    """
    __tablename__ = "comments"
    __table_args__ = (
        Index("ix_comments_post_id", "post_id"),
        Index("ix_comments_author_id", "author_id"),
        Index("ix_comments_parent_id", "parent_id"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    post_id: Mapped[str] = mapped_column(
        String, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False
    )
    author_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    parent_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("comments.id", ondelete="CASCADE"), nullable=True
    )
    body: Mapped[str] = mapped_column(Text, nullable=False)

    # Denormalized
    like_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    reply_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    post: Mapped["Post"] = relationship(  # noqa: F821
        "Post", back_populates="comments"
    )
    author: Mapped["User"] = relationship("User")  # noqa: F821
    parent: Mapped["Comment | None"] = relationship(
        "Comment", remote_side="Comment.id", foreign_keys=[parent_id]
    )
    replies: Mapped[list["Comment"]] = relationship(
        "Comment", back_populates="parent", foreign_keys=[parent_id], lazy="select"
    )
