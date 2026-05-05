import enum

from sqlalchemy import Boolean, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, generate_uuid


class RoomType(str, enum.Enum):
    DIRECT = "DIRECT"          # 1-on-1 DMs
    GROUP = "GROUP"            # Small group chats
    EVENT = "EVENT"            # Live event room (auto-created per event)
    COMMUNITY = "COMMUNITY"    # Event community general chat
    BROADCAST = "BROADCAST"    # Organizer → attendees only (read-only for members)


class ChatRoom(Base, TimestampMixin):
    __tablename__ = "chat_rooms"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    room_type: Mapped[RoomType] = mapped_column(Enum(RoomType), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # For EVENT/COMMUNITY rooms — links back to context
    event_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("events.id", ondelete="CASCADE"), nullable=True
    )
    community_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("event_communities.id", ondelete="CASCADE"), nullable=True
    )
    created_by: Mapped[str] = mapped_column(
        String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    member_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    messages: Mapped[list["ChatMessage"]] = relationship(  # noqa: F821
        "ChatMessage", back_populates="room", lazy="select"
    )
    members: Mapped[list["RoomMember"]] = relationship(  # noqa: F821
        "RoomMember", back_populates="room", lazy="select"
    )
