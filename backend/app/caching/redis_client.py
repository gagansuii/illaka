"""
Redis client with graceful in-memory LRU fallback.
Mirrors the reliability pattern from the original lib/rate-limit.ts.
"""
import asyncio
import logging
import time
from collections import OrderedDict
from typing import Any

import redis.asyncio as aioredis

from app.core.config import settings

logger = logging.getLogger(__name__)

# ─── In-memory LRU fallback ─────────────────────────────────────────────────

class LRUCache:
    def __init__(self, maxsize: int = 5000, default_ttl: int = 60):
        self._cache: OrderedDict[str, tuple[Any, float]] = OrderedDict()
        self._maxsize = maxsize
        self._default_ttl = default_ttl
        self._lock = asyncio.Lock()

    async def get(self, key: str) -> Any | None:
        async with self._lock:
            if key not in self._cache:
                return None
            value, expires_at = self._cache[key]
            if time.monotonic() > expires_at:
                del self._cache[key]
                return None
            self._cache.move_to_end(key)
            return value

    async def set(self, key: str, value: Any, ttl: int | None = None) -> None:
        async with self._lock:
            if key in self._cache:
                self._cache.move_to_end(key)
            self._cache[key] = (value, time.monotonic() + (ttl or self._default_ttl))
            if len(self._cache) > self._maxsize:
                self._cache.popitem(last=False)

    async def delete(self, key: str) -> None:
        async with self._lock:
            self._cache.pop(key, None)

    async def incr(self, key: str, ttl: int | None = None) -> int:
        async with self._lock:
            entry = self._cache.get(key)
            if entry is None or time.monotonic() > entry[1]:
                new_val = 1
            else:
                new_val = entry[0] + 1
            self._cache[key] = (new_val, time.monotonic() + (ttl or self._default_ttl))
            self._cache.move_to_end(key)
            return new_val


# ─── Redis + fallback composite client ──────────────────────────────────────

class CacheClient:
    def __init__(self) -> None:
        self._redis: aioredis.Redis | None = None
        self._fallback = LRUCache()
        self._redis_disabled = False
        self._warned = False

    async def _get_redis(self) -> aioredis.Redis | None:
        if self._redis_disabled or not settings.REDIS_URL:
            return None
        if self._redis is None:
            try:
                self._redis = aioredis.from_url(
                    settings.REDIS_URL,
                    encoding="utf-8",
                    decode_responses=True,
                    socket_connect_timeout=2,
                    socket_timeout=2,
                )
            except Exception as exc:
                self._disable_redis(exc)
                return None
        return self._redis

    def _disable_redis(self, exc: Exception) -> None:
        if not self._warned:
            logger.warning("Redis unavailable, falling back to in-memory LRU: %s", exc)
            self._warned = True
        self._redis_disabled = True
        self._redis = None

    async def get(self, key: str) -> Any | None:
        r = await self._get_redis()
        if r:
            try:
                return await r.get(key)
            except Exception as exc:
                self._disable_redis(exc)
        return await self._fallback.get(key)

    async def set(self, key: str, value: Any, ttl: int = 60) -> None:
        r = await self._get_redis()
        if r:
            try:
                await r.set(key, value, ex=ttl)
                return
            except Exception as exc:
                self._disable_redis(exc)
        await self._fallback.set(key, value, ttl)

    async def delete(self, key: str) -> None:
        r = await self._get_redis()
        if r:
            try:
                await r.delete(key)
                return
            except Exception as exc:
                self._disable_redis(exc)
        await self._fallback.delete(key)

    async def incr(self, key: str, ttl: int = 60) -> int:
        r = await self._get_redis()
        if r:
            try:
                pipe = r.pipeline()
                pipe.incr(key)
                pipe.expire(key, ttl)
                results = await pipe.execute()
                return int(results[0])
            except Exception as exc:
                self._disable_redis(exc)
        return await self._fallback.incr(key, ttl)

    async def rate_limit(self, key: str, limit: int = 60, window: int = 60) -> bool:
        """Returns True if request is allowed, False if limit exceeded."""
        count = await self.incr(f"rl:{key}", ttl=window)
        return count <= limit


cache = CacheClient()
