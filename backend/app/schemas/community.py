from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.community.post import PostType, PostVisibility
from app.models.community.reaction import ReactionType
from app.models.community.event_community import CommunityRole


# ── Shared author stub (avoids circular imports) ──────────────────────────────

class AuthorStub(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    avatar_url: str | None = None
    level: int = 1


# ── Follow ────────────────────────────────────────────────────────────────────

class FollowResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    following: bool
    follower_count: int
    following_count: int


class UserProfilePublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    avatar_url: str | None = None
    bio: str | None = None
    interests: list[str] | None = None
    social_links: dict[str, str] | None = None
    location_label: str | None = None
    xp: int = 0
    level: int = 1
    streak_days: int = 0
    follower_count: int = 0
    following_count: int = 0
    post_count: int = 0
    event_count: int = 0
    is_following: bool = False
    created_at: datetime


# ── Posts ─────────────────────────────────────────────────────────────────────

class PostCreate(BaseModel):
    post_type: PostType = PostType.TEXT
    visibility: PostVisibility = PostVisibility.PUBLIC
    body: str | None = Field(None, max_length=5000)
    media_urls: list[dict[str, Any]] | None = None
    poll_data: dict[str, Any] | None = None
    event_id: str | None = None
    community_id: str | None = None
    hashtags: list[str] | None = Field(None, max_length=10)

    @field_validator("body")
    @classmethod
    def strip_body(cls, v: str | None) -> str | None:
        return v.strip() if v else v

    @field_validator("hashtags", mode="before")
    @classmethod
    def normalise_tags(cls, v: list[str] | None) -> list[str] | None:
        if not v:
            return v
        return [t.lstrip("#").lower()[:50] for t in v]


class PostUpdate(BaseModel):
    body: str | None = Field(None, max_length=5000)
    visibility: PostVisibility | None = None


class PostResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    author: AuthorStub
    post_type: PostType
    visibility: PostVisibility
    body: str | None = None
    media_urls: list[dict[str, Any]] | None = None
    poll_data: dict[str, Any] | None = None
    event_id: str | None = None
    community_id: str | None = None
    repost_of_id: str | None = None
    like_count: int
    comment_count: int
    repost_count: int
    bookmark_count: int
    is_pinned: bool
    hashtags: list[str] = []
    user_reaction: ReactionType | None = None
    is_bookmarked: bool = False
    created_at: datetime
    updated_at: datetime


class PostFeedPage(BaseModel):
    posts: list[PostResponse]
    next_cursor: str | None = None
    has_more: bool


# ── Comments ──────────────────────────────────────────────────────────────────

class CommentCreate(BaseModel):
    body: str = Field(..., min_length=1, max_length=2000)
    parent_id: str | None = None

    @field_validator("body")
    @classmethod
    def strip_body(cls, v: str) -> str:
        return v.strip()


class CommentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    author: AuthorStub
    body: str
    like_count: int
    reply_count: int
    parent_id: str | None = None
    replies: list["CommentResponse"] = []
    created_at: datetime


CommentResponse.model_rebuild()


# ── Reactions ─────────────────────────────────────────────────────────────────

class ReactionCreate(BaseModel):
    reaction_type: ReactionType = ReactionType.LIKE


class ReactionResponse(BaseModel):
    post_id: str
    reaction_type: ReactionType | None  # None = removed
    like_count: int


# ── Event Communities ─────────────────────────────────────────────────────────

class EventCommunityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    event_id: str
    name: str
    description: str | None = None
    cover_url: str | None = None
    is_open: bool
    member_count: int
    is_member: bool = False
    user_role: CommunityRole | None = None
    created_at: datetime


class CommunityJoinResponse(BaseModel):
    joined: bool
    role: CommunityRole
    member_count: int
