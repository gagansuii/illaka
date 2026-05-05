from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.models.gamification.xp_log import XPAction
from app.models.gamification.achievement import AchievementTier


class XPLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    action: XPAction
    points: int
    ref_id: str | None = None
    created_at: datetime


class AchievementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    slug: str
    name: str
    description: str
    tier: AchievementTier
    icon_url: str | None = None
    xp_reward: int
    unlocked: bool = False
    unlocked_at: datetime | None = None


class StreakResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    current_streak: int
    longest_streak: int
    last_check_in: date | None = None


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: str
    name: str
    avatar_url: str | None = None
    xp: int
    level: int


class GamificationProfile(BaseModel):
    xp: int
    level: int
    xp_to_next_level: int
    streak: StreakResponse
    achievements: list[AchievementResponse]
    recent_xp_logs: list[XPLogResponse]
