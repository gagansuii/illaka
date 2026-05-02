"""
HTTP-triggered cron endpoints (for external schedulers like Vercel/Render cron).
APScheduler runs the same jobs automatically; these are emergency manual triggers.
"""
from fastapi import APIRouter, Header
from app.core.config import settings
from app.core.exceptions import UnauthorizedError

router = APIRouter(prefix="/cron", tags=["cron"])


def _verify_cron_secret(authorization: str | None) -> None:
    if not settings.CRON_SECRET:
        raise UnauthorizedError("Cron secret not configured")
    if not authorization or not authorization.startswith("Bearer "):
        raise UnauthorizedError("Missing authorization header")
    token = authorization.removeprefix("Bearer ").strip()
    if token != settings.CRON_SECRET:
        raise UnauthorizedError("Invalid cron secret")


@router.get("/reminders")
async def trigger_reminders(
    authorization: str | None = Header(default=None),
):
    _verify_cron_secret(authorization)
    from app.background.scheduler import run_reminders
    results = await run_reminders()
    return {"ok": True, "results": results}


@router.get("/cleanup-events")
async def trigger_cleanup(
    authorization: str | None = Header(default=None),
):
    _verify_cron_secret(authorization)
    from app.background.scheduler import run_event_cleanup
    result = await run_event_cleanup()
    return result
