from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.caching.redis_client import cache
from app.core.exceptions import RateLimitError
from app.database.session import get_db
from app.models.user import User
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    MeResponse,
    RefreshRequest,
    RegisterRequest,
    RegisterResponse,
    ResetPasswordRequest,
    TokenResponse,
)
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    return (forwarded.split(",")[0].strip() if forwarded else request.client.host) or "unknown"


@router.post("/register", response_model=RegisterResponse, status_code=201)
async def register(
    body: RegisterRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    ip = _client_ip(request)
    if not await cache.rate_limit(f"register:{ip}", limit=5, window=60):
        raise RateLimitError("Too many registration attempts")

    user = await auth_service.register(db, body.name, body.email, body.password)
    return {"id": user.id}


@router.post("/login", response_model=TokenResponse)
async def login(
    body: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    ip = _client_ip(request)
    if not await cache.rate_limit(f"login:{ip}", limit=10, window=60):
        raise RateLimitError("Too many login attempts")

    access_token, refresh_token = await auth_service.login(
        db, body.email, body.password, body.remember_me
    )
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    access_token, refresh_token = await auth_service.refresh_access_token(
        db, body.refresh_token
    )
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.post("/logout", status_code=204)
async def logout():
    """
    Stateless JWT logout — client must discard tokens.
    For full server-side revocation, integrate a token denylist in Redis.
    """
    return None


@router.get("/me", response_model=MeResponse)
async def me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role.value,
        "latitude": current_user.latitude,
        "longitude": current_user.longitude,
        "radius_preference": current_user.radius_preference,
        "subscription_type": current_user.subscription_type,
        "stripe_customer_id": current_user.stripe_customer_id,
    }


@router.post("/forgot-password", status_code=200)
async def forgot_password(
    body: ForgotPasswordRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    ip = _client_ip(request)
    if not await cache.rate_limit(f"forgot:{ip}", limit=5, window=60):
        raise RateLimitError("Too many requests")

    base_url = str(request.base_url).rstrip("/")
    await auth_service.forgot_password(db, body.email, base_url)
    return {"ok": True}


@router.post("/reset-password", status_code=200)
async def reset_password(
    body: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    await auth_service.reset_password(db, body.token, body.password)
    return {"ok": True}
