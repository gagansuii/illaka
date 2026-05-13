"""
Geo-bucketed in-memory events cache.
Mirrors the stale-while-revalidate pattern from lib/events-cache.ts.
"""
import asyncio
import time
from collections import OrderedDict
from dataclasses import dataclass, field


@dataclass
class CacheEntry:
    events: list[dict]
    fetched_at: float = field(default_factory=time.monotonic)


class EventsCache:
    FRESH_TTL = 15       # seconds — return immediately
    STALE_TTL = 75       # seconds — return stale + refresh background
    MAX_ENTRIES = 500

    def __init__(self) -> None:
        self._store: OrderedDict[str, CacheEntry] = OrderedDict()
        self._in_flight: dict[str, asyncio.Future] = {}
        self._lock = asyncio.Lock()

    @staticmethod
    def _normalize_coord(v: float) -> str:
        return f"{v:.4f}"

    @staticmethod
    def _bucket_radius(radius: float) -> int:
        bucket_size = 100
        min_radius = 500
        return max(min_radius, round(radius / bucket_size) * bucket_size)

    def make_key(self, lat: float, lng: float, radius: float) -> str:
        return (
            f"{self._normalize_coord(lat)}:"
            f"{self._normalize_coord(lng)}:"
            f"{self._bucket_radius(radius)}"
        )

    async def get(self, key: str) -> tuple[list[dict] | None, bool]:
        """Returns (events, is_stale). events=None means cache miss."""
        async with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return None, False
            age = time.monotonic() - entry.fetched_at
            if age <= self.FRESH_TTL:
                self._store.move_to_end(key)
                return entry.events, False
            if age <= self.STALE_TTL:
                self._store.move_to_end(key)
                return entry.events, True
            del self._store[key]
            return None, False

    async def set(self, key: str, events: list[dict]) -> None:
        async with self._lock:
            if key in self._store:
                self._store.move_to_end(key)
            self._store[key] = CacheEntry(events=events)
            if len(self._store) > self.MAX_ENTRIES:
                self._store.popitem(last=False)

    async def clear(self) -> None:
        async with self._lock:
            self._store.clear()

    def get_in_flight(self, key: str) -> asyncio.Future | None:
        fut = self._in_flight.get(key)
        if fut and not fut.done():
            return fut
        return None

    def set_in_flight(self, key: str, future: asyncio.Future) -> None:
        self._in_flight[key] = future

    def clear_in_flight(self, key: str) -> None:
        self._in_flight.pop(key, None)


events_cache = EventsCache()
