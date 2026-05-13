"""
Follow/unfollow service with social graph queries.
All counter queries use single atomic UPDATEs to avoid race conditions.
"""
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.community.follow import Follow
from app.models.user import User
from app.core.exceptions import ConflictError, NotFoundError
from app.schemas.community import FollowResponse, UserProfilePublic


async def _get_user_or_404(db: AsyncSession, user_id: str) -> User:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise NotFoundError("User not found")
    return user


async def follow(db: AsyncSession, follower_id: str, target_id: str) -> FollowResponse:
    if follower_id == target_id:
        raise ConflictError("Cannot follow yourself")

    await _get_user_or_404(db, target_id)

    # Check already following
    existing = await db.execute(
        select(Follow).where(Follow.follower_id == follower_id, Follow.following_id == target_id)
    )
    if existing.scalar_one_or_none():
        raise ConflictError("Already following this user")

    db.add(Follow(follower_id=follower_id, following_id=target_id))
    await db.flush()

    counts = await _get_counts(db, follower_id, target_id)
    return FollowResponse(following=True, **counts)


async def unfollow(db: AsyncSession, follower_id: str, target_id: str) -> FollowResponse:
    result = await db.execute(
        delete(Follow)
        .where(Follow.follower_id == follower_id, Follow.following_id == target_id)
        .returning(Follow.id)
    )
    if not result.scalar_one_or_none():
        raise NotFoundError("Not following this user")

    counts = await _get_counts(db, follower_id, target_id)
    return FollowResponse(following=False, **counts)


async def _get_counts(db: AsyncSession, viewer_id: str, target_id: str) -> dict:
    follower_count = await db.scalar(
        select(func.count()).where(Follow.following_id == target_id)
    )
    following_count = await db.scalar(
        select(func.count()).where(Follow.follower_id == viewer_id)
    )
    return {"follower_count": follower_count or 0, "following_count": following_count or 0}


async def get_followers(
    db: AsyncSession, user_id: str, cursor: str | None, limit: int = 20
) -> tuple[list[User], str | None]:
    q = (
        select(User)
        .join(Follow, Follow.follower_id == User.id)
        .where(Follow.following_id == user_id)
        .order_by(Follow.created_at.desc())
        .limit(limit + 1)
    )
    if cursor:
        q = q.where(Follow.id < cursor)

    result = await db.execute(q)
    users = result.scalars().all()
    next_cursor = None
    if len(users) > limit:
        users = users[:limit]
        next_cursor = users[-1].id
    return list(users), next_cursor


async def get_following(
    db: AsyncSession, user_id: str, cursor: str | None, limit: int = 20
) -> tuple[list[User], str | None]:
    q = (
        select(User)
        .join(Follow, Follow.following_id == User.id)
        .where(Follow.follower_id == user_id)
        .order_by(Follow.created_at.desc())
        .limit(limit + 1)
    )
    if cursor:
        q = q.where(Follow.id < cursor)

    result = await db.execute(q)
    users = result.scalars().all()
    next_cursor = None
    if len(users) > limit:
        users = users[:limit]
        next_cursor = users[-1].id
    return list(users), next_cursor


async def get_mutual_follows(db: AsyncSession, user_a: str, user_b: str) -> list[User]:
    """Users that both user_a and user_b follow."""
    a_following = select(Follow.following_id).where(Follow.follower_id == user_a)
    b_following = select(Follow.following_id).where(Follow.follower_id == user_b)
    mutual_ids = a_following.intersect(b_following).scalar_subquery()
    result = await db.execute(select(User).where(User.id.in_(mutual_ids)).limit(10))
    return list(result.scalars().all())


async def is_following(db: AsyncSession, follower_id: str, following_id: str) -> bool:
    result = await db.execute(
        select(Follow.id).where(
            Follow.follower_id == follower_id,
            Follow.following_id == following_id,
        )
    )
    return result.scalar_one_or_none() is not None


async def get_user_profile(
    db: AsyncSession, target_id: str, viewer_id: str | None
) -> UserProfilePublic:
    user = await _get_user_or_404(db, target_id)

    follower_count = await db.scalar(
        select(func.count()).where(Follow.following_id == target_id)
    ) or 0
    following_count = await db.scalar(
        select(func.count()).where(Follow.follower_id == target_id)
    ) or 0

    from app.models.community.post import Post
    from app.models.event import Event
    post_count = await db.scalar(
        select(func.count()).where(Post.author_id == target_id, Post.is_deleted.is_(False))
    ) or 0
    event_count = await db.scalar(
        select(func.count()).where(Event.organizer_id == target_id)
    ) or 0

    viewer_follows = False
    if viewer_id and viewer_id != target_id:
        viewer_follows = await is_following(db, viewer_id, target_id)

    return UserProfilePublic(
        id=user.id,
        name=user.name,
        avatar_url=user.avatar_url,
        bio=user.bio,
        interests=user.interests,
        social_links=user.social_links,
        location_label=user.location_label,
        xp=user.xp,
        level=user.level,
        streak_days=user.streak_days,
        follower_count=follower_count,
        following_count=following_count,
        post_count=post_count,
        event_count=event_count,
        is_following=viewer_follows,
        created_at=user.created_at,
    )
