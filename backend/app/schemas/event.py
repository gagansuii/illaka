from datetime import datetime

from pydantic import BaseModel, field_validator


class CreateEventRequest(BaseModel):
    title: str
    description: str
    banner_url: str | None = None
    badge_icon: str | None = None
    latitude: float
    longitude: float
    start_time: str
    end_time: str
    visibility: str = "PUBLIC"
    capacity: int
    is_paid: bool = False
    ticket_price: float | None = None
    payment_qr_url: str | None = None
    address: str | None = None
    event_type: str = "PHYSICAL"
    online_link: str | None = None
    link_share_mode: str = "INVITE_ONLY"

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3 or len(v) > 200:
            raise ValueError("Title must be between 3 and 200 characters")
        return v

    @field_validator("description")
    @classmethod
    def validate_description(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 10 or len(v) > 5000:
            raise ValueError("Description must be between 10 and 5000 characters")
        return v

    @field_validator("latitude")
    @classmethod
    def validate_lat(cls, v: float) -> float:
        if v < -90 or v > 90:
            raise ValueError("Latitude must be between -90 and 90")
        return v

    @field_validator("longitude")
    @classmethod
    def validate_lon(cls, v: float) -> float:
        if v < -180 or v > 180:
            raise ValueError("Longitude must be between -180 and 180")
        return v

    @field_validator("capacity")
    @classmethod
    def validate_capacity(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("Capacity must be a positive integer")
        return v


class UpdateEventRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    visibility: str | None = None
    capacity: int | None = None
    banner_url: str | None = None
    badge_icon: str | None = None
    start_time: str | None = None
    end_time: str | None = None
    is_paid: bool | None = None
    ticket_price: float | None = None
    payment_qr_url: str | None = None
    address: str | None = None
    event_type: str | None = None
    online_link: str | None = None
    link_share_mode: str | None = None


class EventResponse(BaseModel):
    id: str
    title: str
    description: str
    banner_url: str | None = None
    badge_icon: str | None = None
    latitude: float
    longitude: float
    start_time: datetime
    end_time: datetime
    visibility: str
    capacity: int
    organizer_id: str
    is_paid: bool
    ticket_price: float | None = None
    payment_qr_url: str | None = None
    address: str | None = None
    engagement_score: int
    share_token: str | None = None
    event_type: str
    online_link: str | None = None
    link_share_mode: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class EventListResponse(BaseModel):
    events: list[EventResponse]


class EventWithRSVPCount(EventResponse):
    rsvp_count: int = 0


class MyEventsResponse(BaseModel):
    upcoming: list[EventWithRSVPCount]
    past: list[EventWithRSVPCount]
