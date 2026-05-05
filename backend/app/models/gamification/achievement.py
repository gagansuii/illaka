import enum

from sqlalchemy import Boolean, Enum, ForeignKey, Index, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, generate_uuid


class AchievementTier(str, enum.Enum):
    BRONZE = "BRONZE"
    SILVER = "SILVER"
    GOLD = "GOLD"
    PLATINUM = "PLATINUM"


# Catalogue of all achievements — seeded once, never deleted
ACHIEVEMENT_CATALOGUE = [
    # Event attendance
    {"slug": "first_event", "name": "First Steps", "description": "Attend your first event", "tier": "BRONZE", "xp_reward": 50},
    {"slug": "explorer_5", "name": "Explorer", "description": "Attend 5 events", "tier": "SILVER", "xp_reward": 100},
    {"slug": "adventurer_20", "name": "Adventurer", "description": "Attend 20 events", "tier": "GOLD", "xp_reward": 250},
    {"slug": "legend_50", "name": "Legend", "description": "Attend 50 events", "tier": "PLATINUM", "xp_reward": 500},
    # Hosting
    {"slug": "first_host", "name": "Curator", "description": "Host your first event", "tier": "BRONZE", "xp_reward": 75},
    {"slug": "builder_10", "name": "Builder", "description": "Host 10 events", "tier": "GOLD", "xp_reward": 300},
    # Social
    {"slug": "social_butterfly", "name": "Social Butterfly", "description": "Gain 10 followers", "tier": "BRONZE", "xp_reward": 50},
    {"slug": "influencer_100", "name": "Influencer", "description": "Gain 100 followers", "tier": "SILVER", "xp_reward": 200},
    {"slug": "community_voice", "name": "Community Voice", "description": "Create 10 posts", "tier": "BRONZE", "xp_reward": 50},
    # Streaks
    {"slug": "streak_7", "name": "Week Warrior", "description": "7-day login streak", "tier": "BRONZE", "xp_reward": 70},
    {"slug": "streak_30", "name": "Committed", "description": "30-day login streak", "tier": "SILVER", "xp_reward": 300},
]


class Achievement(Base, TimestampMixin):
    """Definition catalogue entry — one row per achievement type."""
    __tablename__ = "achievements"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    tier: Mapped[AchievementTier] = mapped_column(Enum(AchievementTier), nullable=False)
    icon_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    xp_reward: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    # Criteria stored as JSON for flexibility: {"type": "attend_count", "threshold": 5}
    criteria: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    user_achievements: Mapped[list["UserAchievement"]] = relationship(
        "UserAchievement", back_populates="achievement", lazy="select"
    )


class UserAchievement(Base, TimestampMixin):
    """Junction: which users have unlocked which achievements."""
    __tablename__ = "user_achievements"
    __table_args__ = (
        UniqueConstraint("user_id", "achievement_id", name="uq_user_achievement"),
        Index("ix_user_achievements_user_id", "user_id"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    achievement_id: Mapped[str] = mapped_column(
        String, ForeignKey("achievements.id", ondelete="CASCADE"), nullable=False
    )
    is_notified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="user_achievements")  # noqa: F821
    achievement: Mapped["Achievement"] = relationship("Achievement", back_populates="user_achievements")
