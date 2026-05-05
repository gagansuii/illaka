from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict

from app.models.notification.notification import NotificationType


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    notification_type: NotificationType
    title: str
    body: str | None = None
    data: dict[str, Any] | None = None
    actor_id: str | None = None
    actor_name: str | None = None
    actor_avatar: str | None = None
    is_read: bool
    created_at: datetime


class NotificationPage(BaseModel):
    notifications: list[NotificationResponse]
    unread_count: int
    next_cursor: str | None = None
    has_more: bool


class MarkReadRequest(BaseModel):
    notification_ids: list[str] | None = None  # None = mark all
