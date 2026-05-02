import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    ConflictError,
    NotFoundError,
    UnauthorizedError,
    ValidationError,
)
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)
from app.integrations.mailer import send_password_reset_email
from app.models.password_reset import PasswordResetToken
from app.models.user import User
from app.repositories import user_repo


async def register(
    db: AsyncSession,
    name: str,
    email: str,
    password: str,
) -> User:
    existing = await user_repo.get_by_email(db, email)
    if existing:
        raise ConflictError("Email already registered")

    hashed = hash_password(password)
    return await user_repo.create(
        db, name=name, email=email, password=hashed
    )


async def login(
    db: AsyncSession,
    email: str,
    password: str,
    remember_me: bool = True,
) -> tuple[str, str]:
    """Returns (access_token, refresh_token) or raises."""
    user = await user_repo.get_by_email(db, email)
    if not user or not verify_password(password, user.password):
        raise UnauthorizedError("Invalid email or password")

    access_token = create_access_token(
        subject=user.id,
        role=user.role.value,
    )
    refresh_token = create_refresh_token(
        subject=user.id,
        remember_me=remember_me,
    )
    return access_token, refresh_token


async def refresh_access_token(
    db: AsyncSession, refresh_token: str
) -> tuple[str, str]:
    from jose import JWTError
    from app.core.security import verify_refresh_token

    try:
        payload = verify_refresh_token(refresh_token)
    except JWTError:
        raise UnauthorizedError("Invalid or expired refresh token")

    user_id: str = payload.get("sub", "")
    user = await user_repo.get_by_id(db, user_id)
    if not user:
        raise UnauthorizedError("User not found")

    new_access = create_access_token(subject=user.id, role=user.role.value)
    new_refresh = create_refresh_token(subject=user.id)
    return new_access, new_refresh


async def forgot_password(
    db: AsyncSession,
    email: str,
    base_url: str,
) -> None:
    """Sends reset email. Always returns successfully to prevent enumeration."""
    user = await user_repo.get_by_email(db, email)
    if not user:
        return

    # Expire existing tokens
    from sqlalchemy import update
    await db.execute(
        update(PasswordResetToken)
        .where(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used == False,  # noqa: E712
        )
        .values(used=True)
    )

    token_str = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    token = PasswordResetToken(
        user_id=user.id,
        token=token_str,
        expires_at=expires_at,
    )
    db.add(token)
    await db.flush()

    reset_url = f"{base_url}/reset-password?token={token_str}"
    # Non-blocking — fire and forget
    import asyncio
    asyncio.create_task(send_password_reset_email(user.email, reset_url))


async def reset_password(
    db: AsyncSession,
    token_str: str,
    new_password: str,
) -> None:
    from sqlalchemy import select
    result = await db.execute(
        select(PasswordResetToken).where(PasswordResetToken.token == token_str)
    )
    token = result.scalar_one_or_none()

    if not token:
        raise ValidationError("Invalid reset token")

    now = datetime.now(timezone.utc)
    if token.used or token.expires_at.replace(tzinfo=timezone.utc) < now:
        raise ValidationError("Reset token has expired or already been used")

    hashed = hash_password(new_password)
    await user_repo.update_fields(db, token.user_id, password=hashed)
    token.used = True
    await db.flush()
