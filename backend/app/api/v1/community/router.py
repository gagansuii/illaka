"""
Event community endpoints — join/leave, posts within a community, member management.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, get_current_user_optional
from app.database.session import get_db
from app.models.user import User
from app.models.community.event_community import CommunityRole
from app.services import community_service, feed_service
from app.schemas.community import (
    EventCommunityResponse, CommunityJoinResponse,
    PostCreate, PostResponse, PostFeedPage,
)

router = APIRouter(prefix="/communities", tags=["communities"])


@router.get("/{community_id}", response_model=EventCommunityResponse)
async def get_community(
    community_id: str,
    viewer: User | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    return await community_service.get_community(
        db, community_id, viewer_id=viewer.id if viewer else None
    )


@router.post("/{community_id}/join", response_model=CommunityJoinResponse)
async def join_community(
    community_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await community_service.join(db, community_id, current_user.id)
    from app.services.gamification_service import award_xp
    from app.models.gamification.xp_log import XPAction
    import asyncio
    asyncio.create_task(award_xp(db, current_user.id, XPAction.JOIN_COMMUNITY, ref_id=community_id))
    return result


@router.post("/{community_id}/leave", response_model=CommunityJoinResponse)
async def leave_community(
    community_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await community_service.leave(db, community_id, current_user.id)


@router.get("/{community_id}/feed", response_model=PostFeedPage)
async def get_community_feed(
    community_id: str,
    cursor: str | None = Query(None),
    viewer: User | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    from app.models.community.post import Post
    from app.services.feed_service import _base_post_query, _enrich_post, _cursor_to_dt, _dt_to_cursor

    limit = 20
    cursor_dt = _cursor_to_dt(cursor)
    q = (
        _base_post_query()
        .where(Post.community_id == community_id)
        .order_by(Post.is_pinned.desc(), Post.created_at.desc())
        .limit(limit + 1)
    )
    if cursor_dt:
        q = q.where(Post.created_at < cursor_dt)

    rows = (await db.execute(q)).scalars().all()
    has_more = len(rows) > limit
    rows = rows[:limit]
    viewer_id = viewer.id if viewer else None
    posts = [await _enrich_post(db, p, viewer_id) for p in rows]
    next_cursor = _dt_to_cursor(rows[-1].created_at) if (has_more and rows) else None
    return PostFeedPage(posts=posts, next_cursor=next_cursor, has_more=has_more)


@router.post("/{community_id}/posts", response_model=PostResponse, status_code=201)
async def create_community_post(
    community_id: str,
    data: PostCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify membership
    from sqlalchemy import select
    from app.models.community.event_community import CommunityMember
    member = (await db.execute(
        select(CommunityMember).where(
            CommunityMember.community_id == community_id,
            CommunityMember.user_id == current_user.id,
            CommunityMember.is_banned.is_(False),
        )
    )).scalar_one_or_none()
    if not member:
        from app.core.exceptions import ForbiddenError
        raise ForbiddenError("Join the community first")

    data.community_id = community_id
    post = await feed_service.create_post(db, author_id=current_user.id, data=data)
    from app.services.gamification_service import award_xp
    from app.models.gamification.xp_log import XPAction
    import asyncio
    asyncio.create_task(award_xp(db, current_user.id, XPAction.POST_IN_COMMUNITY, ref_id=community_id))
    return post


@router.patch("/{community_id}/members/{user_id}/role")
async def update_member_role(
    community_id: str,
    user_id: str,
    role: CommunityRole,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await community_service.update_member_role(
        db, community_id, target_user_id=user_id, new_role=role, actor_id=current_user.id
    )
    return {"ok": True}


@router.post("/{community_id}/members/{user_id}/ban")
async def ban_member(
    community_id: str,
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await community_service.ban_member(db, community_id, target_user_id=user_id, actor_id=current_user.id)
    return {"ok": True}
