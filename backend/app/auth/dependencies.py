import hashlib
from datetime import datetime, timezone

from fastapi import Depends, Header
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.core.security import verify_access_token
from app.database.session import get_db
from app.models.user import User, UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


async def _user_from_api_key(raw_key: str, db: AsyncSession) -> User | None:
    from app.models.company import ApiKey, Company

    key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
    result = await db.execute(
        select(ApiKey).where(ApiKey.key_hash == key_hash)
    )
    api_key = result.scalar_one_or_none()
    if api_key is None:
        return None

    # Update last_used_at (single indexed UPDATE, negligible cost)
    await db.execute(
        update(ApiKey)
        .where(ApiKey.id == api_key.id)
        .values(last_used_at=datetime.now(timezone.utc))
    )

    # Load the company's service user
    company_result = await db.execute(
        select(Company).where(Company.id == api_key.company_id)
    )
    company = company_result.scalar_one_or_none()
    if company is None:
        return None

    user = await db.get(User, company.service_user_id)
    if user and user.is_active:
        return user
    return None


async def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    x_api_key: str | None = Header(None, alias="x-api-key"),
    db: AsyncSession = Depends(get_db),
) -> User:
    # API key takes priority when present
    if x_api_key:
        user = await _user_from_api_key(x_api_key, db)
        if user:
            return user
        raise UnauthorizedError("Invalid API key")

    if not token:
        raise UnauthorizedError("Not authenticated")

    try:
        payload = verify_access_token(token)
    except JWTError:
        raise UnauthorizedError("Invalid or expired token")

    user_id: str | None = payload.get("sub")
    if not user_id:
        raise UnauthorizedError("Invalid token payload")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise UnauthorizedError("User not found")
    return user


async def get_current_user_optional(
    token: str | None = Depends(OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)),
    x_api_key: str | None = Header(None, alias="x-api-key"),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    try:
        return await get_current_user(token=token, x_api_key=x_api_key, db=db)
    except UnauthorizedError:
        return None


def require_role(*roles: UserRole):
    async def dependency(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise ForbiddenError(
                f"Required role: {', '.join(r.value for r in roles)}"
            )
        return current_user
    return dependency


require_organizer = require_role(UserRole.ORGANIZER, UserRole.ADMIN)
require_admin = require_role(UserRole.ADMIN)
