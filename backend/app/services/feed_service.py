"""
Community feed service.

Feed tabs:
  - "for_you"   : public posts ranked by a relevance score
  - "following" : posts from people the viewer follows (cursor-paginated)
  - "nearby"    : posts attached to events within the user's radius
  - "trending"  : public posts with highest engagement in last 48h

Ranking formula (for_you / trending):
  score = like_count * 2 + comment_count * 3 + repost_count * 5
          + bookmark_count * 1 - hours_old * 0.5

Pagination: keyset cursor = ISO datetime string of the last post's created_at.
"""
import re
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select, text, update, and_, or_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.community.post import Post, PostVisibility
from app.models.community.comment import Comment
from app.models.community.reaction import Reaction, ReactionType
from app.models.community.bookmark import Bookmark
from app.models.community.follow import Follow
from app.models.community.hashtag import Hashtag, PostHashtag
from app.models.user import User
from app.core.exceptions import ForbiddenError, NotFoundError
from app.schemas.community import PostCreate, PostUpdate, PostResponse, PostFeedPage, AuthorStub

HASHTAG_RE = re.compile(r"#(\w{1,50})")
_LIMIT = 20


def _cursor_to_dt(cursor: str | None) -> datetime | None:
    if not cursor:
        return None
    try:
        return datetime.fromisoformat(cursor)
    except ValueError:
        return None


def _dt_to_cursor(dt: datetime) -> str:
    return dt.isoformat()


async def _enrich_post(
    db: AsyncSession, post: Post, viewer_id: str | None
) -> PostResponse:
    """Attach viewer-specific fields (reaction, bookmark, hashtag list)."""
    user_reaction = None
    is_bookmarked = False
    if viewer_id:
        r = await db.execute(
            select(Reaction.reaction_type).where(
                Reaction.post_id == post.id, Reaction.user_id == viewer_id
            )
        )
        user_reaction = r.scalar_one_or_none()

        bk = await db.execute(
            select(Bookmark.id).where(
                Bookmark.post_id == post.id, Bookmark.user_id == viewer_id
            )
        )
        is_bookmarked = bk.scalar_one_or_none() is not None

    # hashtag names
    ht_q = await db.execute(
        select(Hashtag.tag)
        .join(PostHashtag, PostHashtag.hashtag_id == Hashtag.id)
        .where(PostHashtag.post_id == post.id)
    )
    tag_names = [row[0] for row in ht_q]

    author = AuthorStub(
        id=post.author.id,
        name=post.author.name,
        avatar_url=post.author.avatar_url,
        level=post.author.level,
    )

    return PostResponse(
        id=post.id,
        author=author,
        post_type=post.post_type,
        visibility=post.visibility,
        body=post.body,
        media_urls=post.media_urls,
        poll_data=post.poll_data,
        event_id=post.event_id,
        community_id=post.community_id,
        repost_of_id=post.repost_of_id,
        like_count=post.like_count,
        comment_count=post.comment_count,
        repost_count=post.repost_count,
        bookmark_count=post.bookmark_count,
        is_pinned=post.is_pinned,
        hashtags=tag_names,
        user_reaction=user_reaction,
        is_bookmarked=is_bookmarked,
        created_at=post.created_at,
        updated_at=post.updated_at,
    )


def _base_post_query():
    return (
        select(Post)
        .options(selectinload(Post.author))
        .where(Post.is_deleted.is_(False))
    )


async def get_feed(
    db: AsyncSession,
    tab: str,
    viewer_id: str | None,
    cursor: str | None = None,
    lat: float | None = None,
    lng: float | None = None,
    radius_m: float = 10_000,
) -> PostFeedPage:
    cursor_dt = _cursor_to_dt(cursor)
    limit = _LIMIT

    if tab == "following":
        if not viewer_id:
            return PostFeedPage(posts=[], next_cursor=None, has_more=False)
        following_ids = select(Follow.following_id).where(Follow.follower_id == viewer_id)
        q = _base_post_query().where(
            Post.author_id.in_(following_ids),
            Post.visibility != PostVisibility.COMMUNITY,
        )
        if cursor_dt:
            q = q.where(Post.created_at < cursor_dt)
        q = q.order_by(Post.created_at.desc()).limit(limit + 1)

    elif tab == "trending":
        cutoff = datetime.now(timezone.utc) - timedelta(hours=48)
        score_expr = (
            Post.like_count * 2
            + Post.comment_count * 3
            + Post.repost_count * 5
            + Post.bookmark_count
        )
        q = _base_post_query().where(
            Post.visibility == PostVisibility.PUBLIC,
            Post.created_at >= cutoff,
        )
        if cursor_dt:
            q = q.where(Post.created_at < cursor_dt)
        q = q.order_by(score_expr.desc(), Post.created_at.desc()).limit(limit + 1)

    elif tab == "nearby" and lat is not None and lng is not None:
        # Join to events table via post.event_id and filter by PostGIS distance
        from app.models.event import Event
        q = (
            _base_post_query()
            .join(Event, Post.event_id == Event.id, isouter=True)
            .where(
                Post.visibility == PostVisibility.PUBLIC,
                or_(
                    Post.event_id.is_(None),
                    text(
                        "ST_DWithin(events.location::geography, "
                        "ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radius)"
                    ),
                ),
            )
            .params(lat=lat, lng=lng, radius=radius_m)
        )
        if cursor_dt:
            q = q.where(Post.created_at < cursor_dt)
        q = q.order_by(Post.created_at.desc()).limit(limit + 1)

    else:  # for_you (default)
        q = _base_post_query().where(Post.visibility == PostVisibility.PUBLIC)
        if cursor_dt:
            q = q.where(Post.created_at < cursor_dt)
        score_expr = (
            Post.like_count * 2 + Post.comment_count * 3
            + Post.repost_count * 5 + Post.bookmark_count
        )
        q = q.order_by(score_expr.desc(), Post.created_at.desc()).limit(limit + 1)

    rows = (await db.execute(q)).scalars().all()
    has_more = len(rows) > limit
    rows = rows[:limit]

    # Filter shadow-banned content for non-admin viewers
    if viewer_id:
        viewer = (await db.execute(select(User).where(User.id == viewer_id))).scalar_one_or_none()
        is_admin = viewer and viewer.role.value == "ADMIN"
        if not is_admin:
            rows = [p for p in rows if not p.author.is_shadow_banned]

    posts = [await _enrich_post(db, p, viewer_id) for p in rows]
    next_cursor = _dt_to_cursor(rows[-1].created_at) if (has_more and rows) else None

    return PostFeedPage(posts=posts, next_cursor=next_cursor, has_more=has_more)


async def create_post(
    db: AsyncSession, author_id: str, data: PostCreate
) -> PostResponse:
    # Check shadow ban
    author = (await db.execute(select(User).where(User.id == author_id))).scalar_one()
    if author.is_shadow_banned:
        # Return fake success — shadow-banned users think they posted
        from app.models.base import generate_uuid
        fake = Post(
            id=generate_uuid(), author_id=author_id,
            post_type=data.post_type, visibility=data.visibility,
            body=data.body,
        )
        fake.author = author
        return await _enrich_post(db, fake, author_id)

    post = Post(
        author_id=author_id,
        post_type=data.post_type,
        visibility=data.visibility,
        body=data.body,
        media_urls=data.media_urls,
        poll_data=data.poll_data,
        event_id=data.event_id,
        community_id=data.community_id,
    )
    db.add(post)
    await db.flush()

    # Hashtags — upsert then link
    if data.hashtags:
        from sqlalchemy.dialects.postgresql import insert as pg_insert
        for tag in set(data.hashtags):
            # Upsert hashtag
            ht_result = await db.execute(select(Hashtag).where(Hashtag.tag == tag))
            ht = ht_result.scalar_one_or_none()
            if not ht:
                ht = Hashtag(tag=tag, post_count=1)
                db.add(ht)
                await db.flush()
            else:
                await db.execute(
                    update(Hashtag).where(Hashtag.id == ht.id)
                    .values(post_count=Hashtag.post_count + 1)
                )
            db.add(PostHashtag(post_id=post.id, hashtag_id=ht.id))

    await db.flush()

    # Reload with author
    result = await db.execute(
        _base_post_query().where(Post.id == post.id)
    )
    post = result.scalar_one()
    return await _enrich_post(db, post, author_id)


async def update_post(
    db: AsyncSession, post_id: str, viewer_id: str, data: PostUpdate
) -> PostResponse:
    result = await db.execute(_base_post_query().where(Post.id == post_id))
    post = result.scalar_one_or_none()
    if not post:
        raise NotFoundError("Post not found")
    if post.author_id != viewer_id:
        raise ForbiddenError()

    if data.body is not None:
        post.body = data.body
    if data.visibility is not None:
        post.visibility = data.visibility

    await db.flush()
    return await _enrich_post(db, post, viewer_id)


async def delete_post(db: AsyncSession, post_id: str, viewer_id: str, viewer_role: str) -> None:
    result = await db.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()
    if not post:
        raise NotFoundError("Post not found")
    if post.author_id != viewer_id and viewer_role != "ADMIN":
        raise ForbiddenError()
    post.is_deleted = True
    await db.flush()


async def react_to_post(
    db: AsyncSession, post_id: str, user_id: str, reaction_type: ReactionType | None
) -> dict:
    """Upsert or remove a reaction. Returns new like_count."""
    post = (await db.execute(select(Post).where(Post.id == post_id))).scalar_one_or_none()
    if not post:
        raise NotFoundError("Post not found")

    existing = (
        await db.execute(
            select(Reaction).where(Reaction.post_id == post_id, Reaction.user_id == user_id)
        )
    ).scalar_one_or_none()

    if reaction_type is None:
        # Remove reaction
        if existing:
            await db.delete(existing)
            post.like_count = max(0, post.like_count - 1)
    elif existing:
        existing.reaction_type = reaction_type
    else:
        db.add(Reaction(user_id=user_id, post_id=post_id, reaction_type=reaction_type))
        post.like_count += 1

    await db.flush()
    return {"post_id": post_id, "reaction_type": reaction_type, "like_count": post.like_count}


async def toggle_bookmark(db: AsyncSession, post_id: str, user_id: str) -> dict:
    post = (await db.execute(select(Post).where(Post.id == post_id))).scalar_one_or_none()
    if not post:
        raise NotFoundError("Post not found")

    existing = (
        await db.execute(
            select(Bookmark).where(Bookmark.post_id == post_id, Bookmark.user_id == user_id)
        )
    ).scalar_one_or_none()

    if existing:
        await db.delete(existing)
        post.bookmark_count = max(0, post.bookmark_count - 1)
        saved = False
    else:
        db.add(Bookmark(user_id=user_id, post_id=post_id))
        post.bookmark_count += 1
        saved = True

    await db.flush()
    return {"saved": saved, "bookmark_count": post.bookmark_count}


async def add_comment(
    db: AsyncSession, post_id: str, author_id: str, body: str, parent_id: str | None
) -> Comment:
    post = (await db.execute(select(Post).where(Post.id == post_id))).scalar_one_or_none()
    if not post:
        raise NotFoundError("Post not found")

    if parent_id:
        parent = (await db.execute(select(Comment).where(Comment.id == parent_id))).scalar_one_or_none()
        if not parent or parent.post_id != post_id:
            raise NotFoundError("Parent comment not found")
        parent.reply_count += 1

    comment = Comment(post_id=post_id, author_id=author_id, body=body, parent_id=parent_id)
    db.add(comment)
    post.comment_count += 1
    await db.flush()
    return comment


async def get_comments(
    db: AsyncSession, post_id: str, cursor: str | None, limit: int = 20
) -> tuple[list[Comment], str | None]:
    q = (
        select(Comment)
        .options(selectinload(Comment.author), selectinload(Comment.replies))
        .where(Comment.post_id == post_id, Comment.parent_id.is_(None), Comment.is_deleted.is_(False))
        .order_by(Comment.created_at.asc())
        .limit(limit + 1)
    )
    if cursor:
        cursor_dt = _cursor_to_dt(cursor)
        if cursor_dt:
            q = q.where(Comment.created_at > cursor_dt)

    rows = (await db.execute(q)).scalars().all()
    next_cursor = None
    if len(rows) > limit:
        rows = rows[:limit]
        next_cursor = _dt_to_cursor(rows[-1].created_at)
    return list(rows), next_cursor


async def get_saved_posts(
    db: AsyncSession, user_id: str, cursor: str | None, limit: int = _LIMIT
) -> PostFeedPage:
    q = (
        _base_post_query()
        .join(Bookmark, and_(Bookmark.post_id == Post.id, Bookmark.user_id == user_id))
        .order_by(Bookmark.created_at.desc())
        .limit(limit + 1)
    )
    if cursor:
        cursor_dt = _cursor_to_dt(cursor)
        if cursor_dt:
            q = q.where(Bookmark.created_at < cursor_dt)

    rows = (await db.execute(q)).scalars().all()
    has_more = len(rows) > limit
    rows = rows[:limit]
    posts = [await _enrich_post(db, p, user_id) for p in rows]
    next_cursor = _dt_to_cursor(rows[-1].created_at) if (has_more and rows) else None
    return PostFeedPage(posts=posts, next_cursor=next_cursor, has_more=has_more)
