from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.embeddings import embed_text, is_ai_configured
from app.ai.vector_search import query_similar
from app.core.exceptions import ServiceUnavailableError
from app.models.event import Event, EventVisibility
from app.utils.geo import haversine_m
from app.utils.sanitize import sanitize_media_url


async def semantic_search(
    db: AsyncSession,
    query: str,
    latitude: float,
    longitude: float,
    radius: float = 10000,
) -> list[dict]:
    if not is_ai_configured():
        raise ServiceUnavailableError("AI search not configured")

    vector = await embed_text(query)
    matches = await query_similar(vector, top_k=50)

    if not matches:
        return []

    event_ids = [m["id"] for m in matches]
    score_map = {m["id"]: m["score"] for m in matches}

    result = await db.execute(
        select(Event).where(
            Event.id.in_(event_ids),
            Event.visibility == EventVisibility.PUBLIC,
        )
    )
    events = result.scalars().all()

    ranked = []
    for event in events:
        distance_m = haversine_m(latitude, longitude, event.latitude, event.longitude)
        if distance_m > radius:
            continue

        semantic_score = score_map.get(event.id, 0.0)
        engagement_norm = min(event.engagement_score / 100.0, 1.0)
        final_score = semantic_score * 0.7 + engagement_norm * 0.3

        ranked.append(
            {
                "id": event.id,
                "title": event.title,
                "description": event.description,
                "banner_url": sanitize_media_url(event.banner_url),
                "badge_icon": sanitize_media_url(event.badge_icon),
                "latitude": event.latitude,
                "longitude": event.longitude,
                "start_time": event.start_time.isoformat() if event.start_time else None,
                "end_time": event.end_time.isoformat() if event.end_time else None,
                "visibility": event.visibility.value,
                "capacity": event.capacity,
                "organizer_id": event.organizer_id,
                "is_paid": event.is_paid,
                "ticket_price": event.ticket_price,
                "engagement_score": event.engagement_score,
                "event_type": event.event_type.value,
                "_score": final_score,
            }
        )

    ranked.sort(key=lambda x: x["_score"], reverse=True)
    for item in ranked:
        item.pop("_score", None)

    return ranked
