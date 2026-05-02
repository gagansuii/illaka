from functools import lru_cache

from openai import AsyncOpenAI

from app.core.config import settings

EMBED_MODEL = "text-embedding-3-small"
EMBED_DIMS = 1536


def is_ai_configured() -> bool:
    return settings.ai_search_configured


@lru_cache(maxsize=1)
def _get_client() -> AsyncOpenAI:
    return AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


async def embed_text(text: str) -> list[float]:
    client = _get_client()
    response = await client.embeddings.create(
        input=text,
        model=EMBED_MODEL,
    )
    return response.data[0].embedding
