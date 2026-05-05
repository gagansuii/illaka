import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from jose import JWTError
from pydantic import ValidationError

from app.api.v1.router import v1_router
from app.core.config import settings
from app.core.security import verify_access_token
from app.database.session import AsyncSessionLocal
from app.middleware.logging import RequestLoggingMiddleware
from app.middleware.security_headers import SecurityHeadersMiddleware
from app.websockets.manager import manager
# Celery app import registers all tasks at startup
from app.workers.celery_app import celery_app as _celery  # noqa: F401

logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s %(name)s %(levelname)s %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting %s v%s [%s]", settings.APP_NAME, settings.APP_VERSION, settings.ENVIRONMENT)
    # Seed achievement catalogue on first boot (idempotent)
    await _seed_achievements()
    # Start WebSocket Redis subscriber
    manager.start_subscriber()
    yield
    manager.stop_subscriber()
    logger.info("Shutdown complete")


async def _seed_achievements() -> None:
    """Upsert achievement catalogue rows — safe to run on every startup."""
    from sqlalchemy import select
    from app.database.session import AsyncSessionLocal
    from app.models.gamification.achievement import Achievement, ACHIEVEMENT_CATALOGUE
    from app.models.base import generate_uuid
    from app.workers.gamification_tasks import _slug_to_criteria

    async with AsyncSessionLocal() as db:
        for entry in ACHIEVEMENT_CATALOGUE:
            existing = (await db.execute(
                select(Achievement).where(Achievement.slug == entry["slug"])
            )).scalar_one_or_none()
            if not existing:
                db.add(Achievement(
                    id=generate_uuid(),
                    slug=entry["slug"],
                    name=entry["name"],
                    description=entry["description"],
                    tier=entry["tier"],
                    xp_reward=entry["xp_reward"],
                    criteria=_slug_to_criteria(entry["slug"]),
                ))
        await db.commit()
    logger.info("Achievement catalogue seeded")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="ILAKA Community Platform API — FastAPI + PostgreSQL/PostGIS",
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
    openapi_url="/openapi.json" if not settings.is_production else None,
    lifespan=lifespan,
)

# ─── Middleware ───────────────────────────────────────────────────────────────
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── HTTP Routers ─────────────────────────────────────────────────────────────
app.include_router(v1_router)


# ─── WebSocket endpoint ───────────────────────────────────────────────────────

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    """
    Authenticated WebSocket connection.

    After connecting, the client MUST send a JSON auth message as the FIRST message:
      {"action": "auth", "token": "<jwt_access_token>"}

    The connection is closed with code 4001 if:
      - The first message is not an auth message
      - The token is invalid
      - No message arrives within 10 seconds

    After authentication, the WebSocket handles:
      - Chat messages (join_room / send_message)
      - Real-time notifications (pushed server → client)
      - Typing indicators
      - Read receipts
    """
    await ws.accept()
    import asyncio, json as _json

    # Wait up to 10s for the auth handshake
    try:
        raw = await asyncio.wait_for(ws.receive_text(), timeout=10.0)
        msg = _json.loads(raw)
    except (asyncio.TimeoutError, Exception):
        await ws.close(code=4001, reason="Auth timeout")
        return

    if msg.get("action") != "auth" or not msg.get("token"):
        await ws.close(code=4001, reason="Expected auth message")
        return

    try:
        payload = verify_access_token(msg["token"])
        user_id: str | None = payload.get("sub")
        if not user_id:
            await ws.close(code=4001, reason="Invalid token")
            return
    except JWTError:
        await ws.close(code=4001, reason="Invalid token")
        return

    async with AsyncSessionLocal() as db:
        from app.websockets.chat_handler import handle_connection
        await handle_connection(ws, user_id, db)


# ─── Exception handlers ───────────────────────────────────────────────────────

@app.exception_handler(ValidationError)
async def pydantic_validation_handler(request: Request, exc: ValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors()},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )
