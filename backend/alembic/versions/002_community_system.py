"""community system — social graph, feed, chat, notifications, gamification, moderation

Revision ID: 002
Revises: 001
Create Date: 2026-05-05
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ─── Extend users table ───────────────────────────────────────────────────
    op.add_column("users", sa.Column("avatar_url", sa.String(500), nullable=True))
    op.add_column("users", sa.Column("bio", sa.Text(), nullable=True))
    op.add_column("users", sa.Column("interests", postgresql.JSON(), nullable=True))
    op.add_column("users", sa.Column("social_links", postgresql.JSON(), nullable=True))
    op.add_column("users", sa.Column("location_label", sa.String(200), nullable=True))
    op.add_column("users", sa.Column("xp", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("users", sa.Column("level", sa.Integer(), nullable=False, server_default="1"))
    op.add_column("users", sa.Column("streak_days", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("users", sa.Column("email_verified", sa.Boolean(), nullable=False, server_default="false"))
    op.add_column("users", sa.Column("is_shadow_banned", sa.Boolean(), nullable=False, server_default="false"))
    op.add_column("users", sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"))
    op.create_index("ix_users_xp", "users", ["xp"])

    # ─── Social graph ─────────────────────────────────────────────────────────
    op.create_table(
        "follows",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("follower_id", sa.String(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("following_id", sa.String(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("follower_id", "following_id", name="uq_follow_pair"),
    )
    op.create_index("ix_follows_follower_id", "follows", ["follower_id"])
    op.create_index("ix_follows_following_id", "follows", ["following_id"])

    # ─── Event communities ────────────────────────────────────────────────────
    op.create_table(
        "event_communities",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("event_id", sa.String(), sa.ForeignKey("events.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("cover_url", sa.String(500), nullable=True),
        sa.Column("is_open", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("member_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )

    op.create_table(
        "community_members",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("community_id", sa.String(), sa.ForeignKey("event_communities.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("role", sa.Enum("ADMIN", "MODERATOR", "MEMBER", name="communityrole"), nullable=False, server_default="MEMBER"),
        sa.Column("is_banned", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.UniqueConstraint("community_id", "user_id", name="uq_community_member"),
    )
    op.create_index("ix_community_members_community_id", "community_members", ["community_id"])
    op.create_index("ix_community_members_user_id", "community_members", ["user_id"])

    # ─── Feed posts ───────────────────────────────────────────────────────────
    op.create_table(
        "posts",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("author_id", sa.String(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("post_type", sa.Enum("TEXT", "IMAGE", "VIDEO", "EVENT_SHARE", "POLL", "ANNOUNCEMENT", name="posttype"), nullable=False, server_default="TEXT"),
        sa.Column("visibility", sa.Enum("PUBLIC", "FOLLOWERS", "COMMUNITY", name="postvisibility"), nullable=False, server_default="PUBLIC"),
        sa.Column("body", sa.Text(), nullable=True),
        sa.Column("media_urls", postgresql.JSON(), nullable=True),
        sa.Column("poll_data", postgresql.JSON(), nullable=True),
        sa.Column("event_id", sa.String(), sa.ForeignKey("events.id", ondelete="SET NULL"), nullable=True),
        sa.Column("repost_of_id", sa.String(), sa.ForeignKey("posts.id", ondelete="SET NULL"), nullable=True),
        sa.Column("community_id", sa.String(), sa.ForeignKey("event_communities.id", ondelete="CASCADE"), nullable=True),
        sa.Column("like_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("comment_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("repost_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("bookmark_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("is_pinned", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("report_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    op.create_index("ix_posts_author_id", "posts", ["author_id"])
    op.create_index("ix_posts_event_id", "posts", ["event_id"])
    op.create_index("ix_posts_community_id", "posts", ["community_id"])
    op.create_index("ix_posts_created_at_desc", "posts", ["created_at"])
    op.create_index("ix_posts_feed", "posts", ["visibility", "is_deleted", "created_at"])

    # ─── Comments ─────────────────────────────────────────────────────────────
    op.create_table(
        "comments",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("post_id", sa.String(), sa.ForeignKey("posts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("author_id", sa.String(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("parent_id", sa.String(), sa.ForeignKey("comments.id", ondelete="CASCADE"), nullable=True),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("like_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("reply_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    op.create_index("ix_comments_post_id", "comments", ["post_id"])
    op.create_index("ix_comments_author_id", "comments", ["author_id"])
    op.create_index("ix_comments_parent_id", "comments", ["parent_id"])

    # ─── Reactions ────────────────────────────────────────────────────────────
    op.create_table(
        "reactions",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("post_id", sa.String(), sa.ForeignKey("posts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("reaction_type", sa.Enum("LIKE", "LOVE", "FIRE", "CLAP", "SAD", name="reactiontype"), nullable=False, server_default="LIKE"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.UniqueConstraint("user_id", "post_id", name="uq_reaction_user_post"),
    )
    op.create_index("ix_reactions_post_id", "reactions", ["post_id"])
    op.create_index("ix_reactions_user_id", "reactions", ["user_id"])

    # ─── Bookmarks ────────────────────────────────────────────────────────────
    op.create_table(
        "bookmarks",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("post_id", sa.String(), sa.ForeignKey("posts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.UniqueConstraint("user_id", "post_id", name="uq_bookmark_user_post"),
    )
    op.create_index("ix_bookmarks_user_id", "bookmarks", ["user_id"])

    # ─── Hashtags ─────────────────────────────────────────────────────────────
    op.create_table(
        "hashtags",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("tag", sa.String(100), nullable=False, unique=True),
        sa.Column("post_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    op.create_index("ix_hashtags_tag", "hashtags", ["tag"])

    op.create_table(
        "post_hashtags",
        sa.Column("post_id", sa.String(), sa.ForeignKey("posts.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("hashtag_id", sa.String(), sa.ForeignKey("hashtags.id", ondelete="CASCADE"), primary_key=True),
        sa.UniqueConstraint("post_id", "hashtag_id", name="uq_post_hashtag"),
    )
    op.create_index("ix_post_hashtags_hashtag_id", "post_hashtags", ["hashtag_id"])

    # ─── Chat ─────────────────────────────────────────────────────────────────
    op.create_table(
        "chat_rooms",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("name", sa.String(200), nullable=True),
        sa.Column("room_type", sa.Enum("DIRECT", "GROUP", "EVENT", "COMMUNITY", "BROADCAST", name="roomtype"), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("event_id", sa.String(), sa.ForeignKey("events.id", ondelete="CASCADE"), nullable=True),
        sa.Column("community_id", sa.String(), sa.ForeignKey("event_communities.id", ondelete="CASCADE"), nullable=True),
        sa.Column("created_by", sa.String(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("member_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )

    op.create_table(
        "chat_messages",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("room_id", sa.String(), sa.ForeignKey("chat_rooms.id", ondelete="CASCADE"), nullable=False),
        sa.Column("sender_id", sa.String(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("message_type", sa.Enum("TEXT", "IMAGE", "FILE", "SYSTEM", name="messagetype"), nullable=False, server_default="TEXT"),
        sa.Column("content", sa.Text(), nullable=True),
        sa.Column("media_data", postgresql.JSON(), nullable=True),
        sa.Column("reply_to_id", sa.String(), sa.ForeignKey("chat_messages.id", ondelete="SET NULL"), nullable=True),
        sa.Column("reactions", postgresql.JSON(), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    op.create_index("ix_chat_messages_room_id", "chat_messages", ["room_id"])
    op.create_index("ix_chat_messages_sender_id", "chat_messages", ["sender_id"])
    op.create_index("ix_chat_messages_room_created", "chat_messages", ["room_id", "created_at"])

    op.create_table(
        "room_members",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("room_id", sa.String(), sa.ForeignKey("chat_rooms.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("is_admin", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("is_muted", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("last_read_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.UniqueConstraint("room_id", "user_id", name="uq_room_member"),
    )
    op.create_index("ix_room_members_room_id", "room_members", ["room_id"])
    op.create_index("ix_room_members_user_id", "room_members", ["user_id"])

    # ─── Notifications ────────────────────────────────────────────────────────
    op.create_table(
        "notifications",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("recipient_id", sa.String(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("actor_id", sa.String(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("notification_type", sa.Enum(
            "NEW_FOLLOWER", "POST_LIKE", "POST_COMMENT", "COMMENT_REPLY", "POST_MENTION",
            "EVENT_REMINDER", "RSVP_CONFIRMED", "EVENT_UPDATED", "EVENT_CANCELLED",
            "COMMUNITY_INVITE", "COMMUNITY_POST", "ORGANIZER_ANNOUNCEMENT",
            "PAYMENT_SUCCESS", "PAYMENT_FAILED",
            "ACHIEVEMENT_UNLOCKED", "LEVEL_UP",
            "NEW_MESSAGE",
            name="notificationtype"
        ), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("body", sa.Text(), nullable=True),
        sa.Column("data", postgresql.JSON(), nullable=True),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("is_pushed", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    op.create_index("ix_notifications_is_read", "notifications", ["is_read"])
    op.create_index(
        "ix_notifications_recipient_read",
        "notifications",
        ["recipient_id", "is_read", "created_at"],
    )

    # ─── Gamification ─────────────────────────────────────────────────────────
    op.create_table(
        "xp_logs",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("action", sa.Enum(
            "RSVP_EVENT", "ATTEND_EVENT", "HOST_EVENT",
            "CREATE_POST", "RECEIVE_LIKE", "RECEIVE_COMMENT",
            "FOLLOW_USER", "GAIN_FOLLOWER",
            "DAILY_LOGIN", "STREAK_BONUS",
            "JOIN_COMMUNITY", "POST_IN_COMMUNITY",
            "ADMIN_GRANT", "ADMIN_DEDUCT",
            name="xpaction"
        ), nullable=False),
        sa.Column("points", sa.Integer(), nullable=False),
        sa.Column("ref_id", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    op.create_index("ix_xp_logs_user_id", "xp_logs", ["user_id"])

    op.create_table(
        "achievements",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("slug", sa.String(100), nullable=False, unique=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("tier", sa.Enum("BRONZE", "SILVER", "GOLD", "PLATINUM", name="achievementtier"), nullable=False),
        sa.Column("icon_url", sa.String(500), nullable=True),
        sa.Column("xp_reward", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("criteria", postgresql.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    op.create_index("ix_achievements_slug", "achievements", ["slug"])

    op.create_table(
        "user_achievements",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("achievement_id", sa.String(), sa.ForeignKey("achievements.id", ondelete="CASCADE"), nullable=False),
        sa.Column("is_notified", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.UniqueConstraint("user_id", "achievement_id", name="uq_user_achievement"),
    )
    op.create_index("ix_user_achievements_user_id", "user_achievements", ["user_id"])

    op.create_table(
        "streaks",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("current_streak", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("longest_streak", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_check_in", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    op.create_index("ix_streaks_user_id", "streaks", ["user_id"])

    # ─── Moderation ───────────────────────────────────────────────────────────
    op.create_table(
        "reports",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("reporter_id", sa.String(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("reported_user_id", sa.String(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("reported_post_id", sa.String(), sa.ForeignKey("posts.id", ondelete="SET NULL"), nullable=True),
        sa.Column("reported_comment_id", sa.String(), sa.ForeignKey("comments.id", ondelete="SET NULL"), nullable=True),
        sa.Column("reason", sa.Enum("SPAM", "HARASSMENT", "HATE_SPEECH", "MISINFORMATION", "INAPPROPRIATE_CONTENT", "IMPERSONATION", "OTHER", name="reportreason"), nullable=False),
        sa.Column("details", sa.Text(), nullable=True),
        sa.Column("status", sa.Enum("PENDING", "REVIEWED", "ACTIONED", "DISMISSED", name="reportstatus"), nullable=False, server_default="PENDING"),
        sa.Column("reviewed_by", sa.String(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("moderator_note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    op.create_index("ix_reports_status", "reports", ["status"])
    op.create_index("ix_reports_reporter_id", "reports", ["reporter_id"])

    op.create_table(
        "shadow_bans",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("issued_by", sa.String(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    op.create_index("ix_shadow_bans_user_id", "shadow_bans", ["user_id"])


def downgrade() -> None:
    for tbl in [
        "shadow_bans", "reports",
        "streaks", "user_achievements", "achievements", "xp_logs",
        "notifications",
        "room_members", "chat_messages", "chat_rooms",
        "post_hashtags", "hashtags",
        "bookmarks", "reactions", "comments", "posts",
        "community_members", "event_communities",
        "follows",
    ]:
        op.drop_table(tbl)

    for col in [
        "avatar_url", "bio", "interests", "social_links", "location_label",
        "xp", "level", "streak_days", "email_verified", "is_shadow_banned", "is_active",
    ]:
        op.drop_column("users", col)

    for enum_name in [
        "communityrole", "posttype", "postvisibility", "reactiontype",
        "roomtype", "messagetype", "notificationtype", "xpaction",
        "achievementtier", "reportreason", "reportstatus",
    ]:
        op.execute(f"DROP TYPE IF EXISTS {enum_name}")
