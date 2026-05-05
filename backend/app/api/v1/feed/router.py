"""
Community feed endpoints — posts, comments, reactions, bookmarks.
"""
import asyncio
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, get_current_user_optional
from app.database.session import get_db
from app.models.user import User
from app.models.community.reaction import ReactionType
from app.services import feed_service
from app.services.gamification_service import award_xp, check_achievements
from app.models.gamification.xp_log import XPAction
from app.schemas.community import (
    PostCreate, PostUpdate, PostResponse, PostFeedPage,
    CommentCreate, CommentResponse, ReactionCreate, ReactionResponse,
)

router = APIRouter(prefix="/feed", tags=["feed"])


# ── Feed ──────────────────────────────────────────────────────────────────────

@router.get("", response_model=PostFeedPage)
async def get_feed(
    tab: str = Query("for_you", regex="^(for_you|following|nearby|trending)$"),
    cursor: str | None = Query(None),
    lat: float | None = Query(None),
    lng: float | None = Query(None),
    radius: float = Query(10_000, ge=1000, le=100_000),
    viewer: User | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    return await feed_service.get_feed(
        db,
        tab=tab,
        viewer_id=viewer.id if viewer else None,
        cursor=cursor,
        lat=lat,
        lng=lng,
        radius_m=radius,
    )


# ── Posts ─────────────────────────────────────────────────────────────────────

@router.post("/posts", response_model=PostResponse, status_code=201)
async def create_post(
    data: PostCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    post = await feed_service.create_post(db, author_id=current_user.id, data=data)
    asyncio.create_task(award_xp(db, current_user.id, XPAction.CREATE_POST, ref_id=post.id))
    asyncio.create_task(check_achievements(db, current_user.id))
    return post


@router.put("/posts/{post_id}", response_model=PostResponse)
async def update_post(
    post_id: str,
    data: PostUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await feed_service.update_post(db, post_id, current_user.id, data)


@router.delete("/posts/{post_id}", status_code=204)
async def delete_post(
    post_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await feed_service.delete_post(db, post_id, current_user.id, current_user.role.value)


# ── Reactions ─────────────────────────────────────────────────────────────────

@router.post("/posts/{post_id}/react", response_model=ReactionResponse)
async def react_to_post(
    post_id: str,
    data: ReactionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await feed_service.react_to_post(db, post_id, current_user.id, data.reaction_type)
    # Notify post author + award XP (best-effort)
    from sqlalchemy import select
    from app.models.community.post import Post
    post_row = (await db.execute(select(Post).where(Post.id == post_id))).scalar_one_or_none()
    if post_row:
        from app.services.notification_service import notify_post_liked
        asyncio.create_task(notify_post_liked(db, current_user.id, post_row.author_id, post_id))
        asyncio.create_task(award_xp(db, post_row.author_id, XPAction.RECEIVE_LIKE, ref_id=post_id))
    return result


@router.delete("/posts/{post_id}/react", response_model=ReactionResponse)
async def remove_reaction(
    post_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await feed_service.react_to_post(db, post_id, current_user.id, reaction_type=None)


# ── Bookmarks ─────────────────────────────────────────────────────────────────

@router.post("/posts/{post_id}/bookmark")
async def toggle_bookmark(
    post_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await feed_service.toggle_bookmark(db, post_id, current_user.id)


@router.get("/saved", response_model=PostFeedPage)
async def get_saved_posts(
    cursor: str | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await feed_service.get_saved_posts(db, current_user.id, cursor)


# ── Comments ─────────────────────────────────────────────────────────────────

@router.post("/posts/{post_id}/comments", response_model=CommentResponse, status_code=201)
async def add_comment(
    post_id: str,
    data: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    comment = await feed_service.add_comment(
        db, post_id, current_user.id, data.body, data.parent_id
    )
    # Notify post author (best-effort)
    from sqlalchemy import select
    from app.models.community.post import Post
    from app.services.notification_service import notify_post_comment
    post_row = (await db.execute(select(Post).where(Post.id == post_id))).scalar_one_or_none()
    if post_row:
        asyncio.create_task(notify_post_comment(db, current_user.id, post_row.author_id, post_id))
        asyncio.create_task(award_xp(db, post_row.author_id, XPAction.RECEIVE_COMMENT, ref_id=post_id))
    return comment


@router.get("/posts/{post_id}/comments")
async def get_comments(
    post_id: str,
    cursor: str | None = Query(None),
    limit: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    comments, next_cursor = await feed_service.get_comments(db, post_id, cursor, limit)
    return {"comments": comments, "next_cursor": next_cursor}
