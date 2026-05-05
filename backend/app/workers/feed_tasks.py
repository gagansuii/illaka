"""
Feed background tasks — trending score recalculation and fan-out.
"""
import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(
    name="app.workers.feed_tasks.recalculate_trending_scores",
    queue="feed",
)
def recalculate_trending_scores():
    """
    Recompute denormalised engagement counters on posts to keep trending feed fresh.
    Uses a single UPDATE ... FROM subquery to avoid N+1.
    """
    from sqlalchemy import create_engine, text
    from app.core.config import settings

    sync_url = settings.DATABASE_URL.replace("+asyncpg", "")
    engine = create_engine(sync_url, pool_pre_ping=True)

    with engine.begin() as conn:
        # Sync like_count from reactions table
        conn.execute(text("""
            UPDATE posts p
            SET like_count = sub.cnt
            FROM (
                SELECT post_id, COUNT(*) AS cnt FROM reactions GROUP BY post_id
            ) sub
            WHERE p.id = sub.post_id
        """))

        # Sync comment_count
        conn.execute(text("""
            UPDATE posts p
            SET comment_count = sub.cnt
            FROM (
                SELECT post_id, COUNT(*) AS cnt
                FROM comments
                WHERE is_deleted = false AND parent_id IS NULL
                GROUP BY post_id
            ) sub
            WHERE p.id = sub.post_id
        """))

        # Sync bookmark_count
        conn.execute(text("""
            UPDATE posts p
            SET bookmark_count = sub.cnt
            FROM (
                SELECT post_id, COUNT(*) AS cnt FROM bookmarks GROUP BY post_id
            ) sub
            WHERE p.id = sub.post_id
        """))

    logger.info("Trending score recalculation complete")


@shared_task(
    name="app.workers.feed_tasks.fanout_post_to_followers",
    queue="feed",
)
def fanout_post_to_followers(post_id: str, author_id: str):
    """
    Future: push post_id into per-user Redis feed lists for O(1) feed reads.
    For now logs intent — implement when scaling to 10k+ followers per user.
    """
    logger.info("Feed fanout: post=%s author=%s (stub — implement at scale)", post_id, author_id)
