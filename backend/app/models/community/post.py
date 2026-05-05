import enum

from sqlalchemy import (
    Boolean, Enum, ForeignKey, Index, Integer, String, Text, JSON
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, generate_uuid


class PostType(str, enum.Enum):
    TEXT = "TEXT"
    IMAGE = "IMAGE"
    VIDEO = "VIDEO"
    EVENT_SHARE = "EVENT_SHARE"
    POLL = "POLL"
    ANNOUNCEMENT = "ANNOUNCEMENT"


class PostVisibility(str, enum.Enum):
    PUBLIC = "PUBLIC"
    FOLLOWERS = "FOLLOWERS"
    COMMUNITY = "COMMUNITY"


class Post(Base, TimestampMixin):
    """
    Core community feed post.
    Supports text, media, event shares, and polls.
    Soft-deleted via is_deleted flag so threads remain coherent.
    """
    __tablename__ = "posts"
    __table_args__ = (
        Index("ix_posts_author_id", "author_id"),
        Index("ix_posts_event_id", "event_id"),
        Index("ix_posts_community_id", "community_id"),
        # Feed ranking index — created_at DESC is the primary sort key
        Index("ix_posts_created_at_desc", "created_at"),
        # Composite for feed queries: visibility + is_deleted + created_at
        Index("ix_posts_feed", "visibility", "is_deleted", "created_at"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    author_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    post_type: Mapped[PostType] = mapped_column(
        Enum(PostType), default=PostType.TEXT, nullable=False
    )
    visibility: Mapped[PostVisibility] = mapped_column(
        Enum(PostVisibility), default=PostVisibility.PUBLIC, nullable=False
    )

    # Content
    body: Mapped[str | None] = mapped_column(Text, nullable=True)
    # media_urls: list of {"url": str, "type": "image"|"video", "alt": str}
    media_urls: Mapped[list | None] = mapped_column(JSON, nullable=True)
    # poll_options: {"question": str, "options": [{"id": str, "text": str, "votes": int}]}
    poll_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Optional: pin to a specific event community
    event_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("events.id", ondelete="SET NULL"), nullable=True
    )
    # Optional: repost of another post
    repost_of_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("posts.id", ondelete="SET NULL"), nullable=True
    )
    # Optional: event community scope
    community_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("event_communities.id", ondelete="CASCADE"), nullable=True
    )

    # Denormalized counters — updated atomically by triggers/workers
    like_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    comment_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    repost_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    bookmark_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Moderation
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    report_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationships
    author: Mapped["User"] = relationship(  # noqa: F821
        "User", back_populates="posts", foreign_keys=[author_id]
    )
    comments: Mapped[list["Comment"]] = relationship(  # noqa: F821
        "Comment", back_populates="post", lazy="select"
    )
    reactions: Mapped[list["Reaction"]] = relationship(  # noqa: F821
        "Reaction", back_populates="post", lazy="select"
    )
    bookmarks: Mapped[list["Bookmark"]] = relationship(  # noqa: F821
        "Bookmark", back_populates="post", lazy="select"
    )
    hashtags: Mapped[list["PostHashtag"]] = relationship(  # noqa: F821
        "PostHashtag", back_populates="post", lazy="select"
    )
    repost_of: Mapped["Post | None"] = relationship(
        "Post", remote_side="Post.id", foreign_keys=[repost_of_id], lazy="select"
    )
