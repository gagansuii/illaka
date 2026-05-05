from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories import event_repo, user_repo
from app.utils.sanitize import strip_html


async def update_profile(
    db: AsyncSession,
    user_id: str,
    name: str | None,
    radius_preference: int | None,
) -> None:
    fields = {}
    if name is not None:
        clean = strip_html(name).strip()
        if 2 <= len(clean) <= 100:
            fields["name"] = clean
    if radius_preference is not None and radius_preference > 0:
        fields["radius_preference"] = radius_preference
    if fields:
        await user_repo.update_fields(db, user_id, **fields)


async def update_social_profile(
    db: AsyncSession,
    user_id: str,
    data: dict,
) -> None:
    fields = {k: v for k, v in data.items() if v is not None}
    if fields:
        await user_repo.update_fields(db, user_id, **fields)


async def update_location(
    db: AsyncSession,
    user_id: str,
    latitude: float,
    longitude: float,
    radius: int | None = None,
) -> None:
    fields = {"latitude": latitude, "longitude": longitude}
    if radius is not None and radius > 0:
        fields["radius_preference"] = radius
    await user_repo.update_fields(db, user_id, **fields)


async def get_my_events(db: AsyncSession, user_id: str) -> dict:
    events = await event_repo.list_by_organizer(db, user_id)
    now = datetime.now(timezone.utc)
    upcoming = []
    past = []
    for event in events:
        end = event.end_time
        if end.tzinfo is None:
            end = end.replace(tzinfo=timezone.utc)
        rsvp_count = await event_repo.get_rsvp_count(db, event.id)
        entry = {
            "id": event.id,
            "title": event.title,
            "start_time": event.start_time.isoformat(),
            "end_time": event.end_time.isoformat(),
            "capacity": event.capacity,
            "rsvp_count": rsvp_count,
            "visibility": event.visibility.value,
            "engagement_score": event.engagement_score,
        }
        if end >= now:
            upcoming.append(entry)
        else:
            past.append(entry)
    return {"upcoming": upcoming, "past": past}


async def get_members(db: AsyncSession) -> dict:
    members, total = await user_repo.list_recent(db, limit=8)
    return {
        "members": [
            {
                "id": m.id,
                "name": m.name,
                "email": m.email,
                "role": m.role.value,
                "created_at": m.created_at.isoformat(),
            }
            for m in members
        ],
        "total_members": total,
    }
