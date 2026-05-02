"""
IP geolocation with circuit breaker pattern.
Mirrors lib/geo.ts — tries ipinfo.io first, falls back to ip-api.com.
"""
import logging
import time
from dataclasses import dataclass

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

CIRCUIT_FAILURE_THRESHOLD = 3
CIRCUIT_OPEN_WINDOW = 60  # seconds


@dataclass
class GeoLocation:
    latitude: float
    longitude: float
    city: str | None = None
    region: str | None = None


class CircuitBreaker:
    def __init__(self) -> None:
        self._failures = 0
        self._open_until = 0.0

    def is_open(self) -> bool:
        if self._open_until and time.monotonic() < self._open_until:
            return True
        if self._open_until and time.monotonic() >= self._open_until:
            self._failures = 0
            self._open_until = 0.0
        return False

    def record_failure(self) -> None:
        self._failures += 1
        if self._failures >= CIRCUIT_FAILURE_THRESHOLD:
            self._open_until = time.monotonic() + CIRCUIT_OPEN_WINDOW
            logger.warning("Geo circuit breaker OPEN for %ds", CIRCUIT_OPEN_WINDOW)

    def record_success(self) -> None:
        self._failures = 0
        self._open_until = 0.0


_ipinfo_cb = CircuitBreaker()
_ipapi_cb = CircuitBreaker()


async def _try_ipinfo(ip: str) -> GeoLocation | None:
    if _ipinfo_cb.is_open():
        return None
    token = settings.IPINFO_TOKEN
    url = f"https://ipinfo.io/{ip}/json"
    params = {"token": token} if token else {}
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            r = await client.get(url, params=params)
            r.raise_for_status()
            data = r.json()
            if "loc" not in data:
                return None
            lat, lng = map(float, data["loc"].split(","))
            _ipinfo_cb.record_success()
            return GeoLocation(
                latitude=lat,
                longitude=lng,
                city=data.get("city"),
                region=data.get("region"),
            )
    except Exception as exc:
        logger.debug("ipinfo.io failed for %s: %s", ip, exc)
        _ipinfo_cb.record_failure()
        return None


async def _try_ipapi(ip: str) -> GeoLocation | None:
    if _ipapi_cb.is_open():
        return None
    url = f"http://ip-api.com/json/{ip}"
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            r = await client.get(url)
            r.raise_for_status()
            data = r.json()
            if data.get("status") != "success":
                return None
            _ipapi_cb.record_success()
            return GeoLocation(
                latitude=float(data["lat"]),
                longitude=float(data["lon"]),
                city=data.get("city"),
                region=data.get("regionName"),
            )
    except Exception as exc:
        logger.debug("ip-api.com failed for %s: %s", ip, exc)
        _ipapi_cb.record_failure()
        return None


async def locate_ip(ip: str) -> GeoLocation | None:
    result = await _try_ipinfo(ip)
    if result:
        return result
    return await _try_ipapi(ip)
