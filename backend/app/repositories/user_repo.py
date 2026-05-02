from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


async def get_by_id(db: AsyncSession, user_id: str) -> User | None:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def get_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def create(db: AsyncSession, **kwargs) -> User:
    user = User(**kwargs)
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


async def update_fields(db: AsyncSession, user_id: str, **fields) -> None:
    await db.execute(
        update(User).where(User.id == user_id).values(**fields)
    )


async def list_recent(db: AsyncSession, limit: int = 8) -> tuple[list[User], int]:
    users = (
        await db.execute(
            select(User).order_by(User.created_at.desc()).limit(limit)
        )
    ).scalars().all()
    total = (await db.execute(select(func.count(User.id)))).scalar_one()
    return list(users), total


async def list_paginated(
    db: AsyncSession, page: int = 0, page_size: int = 50
) -> tuple[list[User], int]:
    users = (
        await db.execute(
            select(User)
            .order_by(User.created_at.desc())
            .offset(page * page_size)
            .limit(page_size)
        )
    ).scalars().all()
    total = (await db.execute(select(func.count(User.id)))).scalar_one()
    return list(users), total


async def delete(db: AsyncSession, user_id: str) -> None:
    user = await get_by_id(db, user_id)
    if user:
        await db.delete(user)
