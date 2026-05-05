from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.models.chat.room import RoomType
from app.models.chat.message import MessageType


class RoomCreate(BaseModel):
    name: str | None = Field(None, max_length=200)
    room_type: RoomType = RoomType.GROUP
    description: str | None = None
    member_ids: list[str] = Field(default_factory=list, max_length=50)


class RoomResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str | None = None
    room_type: RoomType
    description: str | None = None
    event_id: str | None = None
    community_id: str | None = None
    member_count: int
    is_active: bool
    created_at: datetime


class MessageSend(BaseModel):
    content: str | None = Field(None, max_length=4000)
    message_type: MessageType = MessageType.TEXT
    media_data: dict[str, Any] | None = None
    reply_to_id: str | None = None


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    room_id: str
    sender_id: str | None = None
    sender_name: str | None = None
    sender_avatar: str | None = None
    message_type: MessageType
    content: str | None = None
    media_data: dict[str, Any] | None = None
    reply_to_id: str | None = None
    reactions: dict[str, list[str]] | None = None
    is_deleted: bool
    created_at: datetime


class MessagePage(BaseModel):
    messages: list[MessageResponse]
    next_cursor: str | None = None
    has_more: bool


# ── WebSocket wire format ─────────────────────────────────────────────────────

class WSIncoming(BaseModel):
    """Messages sent FROM client TO server over WebSocket."""
    action: str  # "send_message" | "typing" | "read" | "react" | "ping"
    room_id: str | None = None
    data: dict[str, Any] = Field(default_factory=dict)


class WSOutgoing(BaseModel):
    """Messages pushed FROM server TO client over WebSocket."""
    event: str  # "message" | "typing" | "read_receipt" | "user_joined" | "notification" | "pong"
    data: dict[str, Any] = Field(default_factory=dict)
