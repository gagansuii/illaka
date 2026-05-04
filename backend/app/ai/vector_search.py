import asyncio
from functools import lru_cache, partial

from pinecone import Pinecone

from app.core.config import settings


@lru_cache(maxsize=1)
def _get_index():
    pc = Pinecone(api_key=settings.PINECONE_API_KEY)
    return pc.Index(settings.PINECONE_INDEX)


async def query_similar(
    vector: list[float],
    top_k: int = 50,
) -> list[dict]:
    """Returns list of {id, score, metadata}. Runs sync SDK call in executor."""
    index = _get_index()
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        None,
        partial(index.query, vector=vector, top_k=top_k, include_metadata=True),
    )
    return [
        {"id": m.id, "score": m.score, "metadata": m.metadata or {}}
        for m in result.matches
    ]


async def upsert_event(
    event_id: str,
    vector: list[float],
    latitude: float,
    longitude: float,
) -> None:
    index = _get_index()
    vectors = [
        {
            "id": event_id,
            "values": vector,
            "metadata": {"latitude": latitude, "longitude": longitude},
        }
    ]
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, partial(index.upsert, vectors=vectors))


async def delete_event(event_id: str) -> None:
    index = _get_index()
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, partial(index.delete, ids=[event_id]))
