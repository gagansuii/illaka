from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.core.security import verify_access_token
from app.database.session import get_db
from app.models.user import User, UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def _get_token_payload(token: str = Depends(oauth2_scheme)) -> dict:
    try:
        return verify_access_token(token)
    except JWTError:
        raise UnauthorizedError("Invalid or expired token")


async def get_current_user(
    payload: dict = Depends(_get_token_payload),
    db: AsyncSession = Depends(get_db),
) -> User:
    from sqlalchemy import select

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
    db: AsyncSession = Depends(get_db),
) -> User | None:
    if not token:
        return None
    try:
        payload = verify_access_token(token)
        user_id = payload.get("sub")
        if not user_id:
            return None
        from sqlalchemy import select
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()
    except JWTError:
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
