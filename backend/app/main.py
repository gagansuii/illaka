import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.openapi.utils import get_openapi
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

logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s %(name)s %(levelname)s %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting %s v%s [%s]", settings.APP_NAME, settings.APP_VERSION, settings.ENVIRONMENT)
    # Start WebSocket Redis subscriber
    manager.start_subscriber()
    yield
    manager.stop_subscriber()
    logger.info("Shutdown complete")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "**ILAAKA Community Platform API**\n\n"
        "Authenticate with **Bearer JWT** (for user sessions) or an **`x-api-key` header** "
        "(for B2B integrations). API keys are issued per company — contact the ILAAKA team to "
        "get onboarded.\n\n"
        "All endpoints are versioned under `/api/v1/`."
    ),
    # Docs enabled in all environments — secured via API key scheme in production
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)


def _custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    schema.setdefault("components", {}).setdefault("securitySchemes", {}).update({
        "BearerAuth": {"type": "http", "scheme": "bearer", "bearerFormat": "JWT"},
        "ApiKeyAuth": {"type": "apiKey", "in": "header", "name": "x-api-key"},
    })
    # Apply both schemes globally so Swagger UI shows auth inputs for all routes
    schema["security"] = [{"BearerAuth": []}, {"ApiKeyAuth": []}]
    app.openapi_schema = schema
    return schema


app.openapi = _custom_openapi  # type: ignore[method-assign]

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
async def websocket_endpoint(ws: WebSocket, token: str):
    """
    Authenticated WebSocket connection.
    Query param: ?token=<jwt_access_token>

    The client authenticates once via the token param.
    After connection, the same WebSocket handles:
      - Chat messages (join_room / send_message)
      - Real-time notifications (pushed server → client)
      - Typing indicators
      - Read receipts
    """
    # Authenticate
    try:
        payload = verify_access_token(token)
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
