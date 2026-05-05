import enum

from sqlalchemy import Boolean, Enum, ForeignKey, Index, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, generate_uuid


class MessageType(str, enum.Enum):
    TEXT = "TEXT"
    IMAGE = "IMAGE"
    FILE = "FILE"
    SYSTEM = "SYSTEM"   # "User joined", "Event starts in 1h"


class ChatMessage(Base, TimestampMixin):
    __tablename__ = "chat_messages"
    __table_args__ = (
        Index("ix_chat_messages_room_id", "room_id"),
        Index("ix_chat_messages_sender_id", "sender_id"),
        # Cursor-based pagination: room + created_at DESC
        Index("ix_chat_messages_room_created", "room_id", "created_at"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    room_id: Mapped[str] = mapped_column(
        String, ForeignKey("chat_rooms.id", ondelete="CASCADE"), nullable=False
    )
    sender_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    message_type: Mapped[MessageType] = mapped_column(
        Enum(MessageType), default=MessageType.TEXT, nullable=False
    )
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    # For IMAGE/FILE: {"url": str, "name": str, "size": int, "mime": str}
    media_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    # For reply threading: id of the message being replied to
    reply_to_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("chat_messages.id", ondelete="SET NULL"), nullable=True
    )
    # emoji reactions: {"🔥": ["user_id1", "user_id2"], "❤️": ["user_id3"]}
    reactions: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    room: Mapped["ChatRoom"] = relationship("ChatRoom", back_populates="messages")  # noqa: F821
    sender: Mapped["User | None"] = relationship("User")  # noqa: F821
