"""
Social graph endpoints: follow, unfollow, followers, following, user profiles.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, get_current_user_optional
from app.database.session import get_db
from app.models.user import User
from app.services import follow_service
from app.schemas.community import FollowResponse, UserProfilePublic

router = APIRouter(prefix="/social", tags=["social"])


@router.post("/users/{user_id}/follow", response_model=FollowResponse)
async def follow_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await follow_service.follow(db, follower_id=current_user.id, target_id=user_id)
    # Fire-and-forget: notify the followed user
    from app.services.notification_service import notify_new_follower
    import asyncio
    asyncio.create_task(notify_new_follower(db, actor_id=current_user.id, recipient_id=user_id))
    # Award XP to follower
    from app.services.gamification_service import award_xp
    from app.models.gamification.xp_log import XPAction
    asyncio.create_task(award_xp(db, current_user.id, XPAction.FOLLOW_USER, ref_id=user_id))
    asyncio.create_task(award_xp(db, user_id, XPAction.GAIN_FOLLOWER, ref_id=current_user.id))
    return result


@router.delete("/users/{user_id}/follow", response_model=FollowResponse)
async def unfollow_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await follow_service.unfollow(db, follower_id=current_user.id, target_id=user_id)


@router.get("/users/{user_id}/profile", response_model=UserProfilePublic)
async def get_user_profile(
    user_id: str,
    viewer: User | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    return await follow_service.get_user_profile(
        db, target_id=user_id, viewer_id=viewer.id if viewer else None
    )


@router.get("/users/{user_id}/followers")
async def get_followers(
    user_id: str,
    cursor: str | None = Query(None),
    limit: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    users, next_cursor = await follow_service.get_followers(db, user_id, cursor, limit)
    return {
        "users": [{"id": u.id, "name": u.name, "avatar_url": u.avatar_url, "level": u.level} for u in users],
        "next_cursor": next_cursor,
    }


@router.get("/users/{user_id}/following")
async def get_following(
    user_id: str,
    cursor: str | None = Query(None),
    limit: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    users, next_cursor = await follow_service.get_following(db, user_id, cursor, limit)
    return {
        "users": [{"id": u.id, "name": u.name, "avatar_url": u.avatar_url, "level": u.level} for u in users],
        "next_cursor": next_cursor,
    }


@router.get("/users/{user_id}/mutual-follows")
async def get_mutual_follows(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    users = await follow_service.get_mutual_follows(db, current_user.id, user_id)
    return {"users": [{"id": u.id, "name": u.name, "avatar_url": u.avatar_url} for u in users]}
