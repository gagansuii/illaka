import enum

from sqlalchemy import Boolean, Enum, ForeignKey, Index, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, generate_uuid


class CommunityRole(str, enum.Enum):
    ADMIN = "ADMIN"
    MODERATOR = "MODERATOR"
    MEMBER = "MEMBER"


class EventCommunity(Base, TimestampMixin):
    """
    Every event gets a community hub — the social spine around the event.
    Organizer is auto-joined as ADMIN on event creation.
    """
    __tablename__ = "event_communities"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    event_id: Mapped[str] = mapped_column(
        String, ForeignKey("events.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    cover_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_open: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    member_count: Mapped[int] = mapped_column(
        # Denormalized — updated by service on join/leave
        __import__("sqlalchemy").Integer, default=0, nullable=False
    )

    members: Mapped[list["CommunityMember"]] = relationship(
        "CommunityMember", back_populates="community", lazy="select"
    )
    posts: Mapped[list["Post"]] = relationship(  # noqa: F821
        "Post",
        primaryjoin="Post.community_id == EventCommunity.id",
        foreign_keys="Post.community_id",
        lazy="select",
    )


class CommunityMember(Base, TimestampMixin):
    """
    Membership link between a User and an EventCommunity.
    """
    __tablename__ = "community_members"
    __table_args__ = (
        UniqueConstraint("community_id", "user_id", name="uq_community_member"),
        Index("ix_community_members_community_id", "community_id"),
        Index("ix_community_members_user_id", "user_id"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    community_id: Mapped[str] = mapped_column(
        String, ForeignKey("event_communities.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    role: Mapped[CommunityRole] = mapped_column(
        Enum(CommunityRole), default=CommunityRole.MEMBER, nullable=False
    )
    is_banned: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    community: Mapped["EventCommunity"] = relationship(
        "EventCommunity", back_populates="members"
    )
    user: Mapped["User"] = relationship("User")  # noqa: F821
