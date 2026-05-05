from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.services.gamification_service import (
    get_profile, get_leaderboard, check_and_update_streak, check_achievements
)
from app.schemas.gamification import GamificationProfile, LeaderboardEntry

router = APIRouter(prefix="/gamification", tags=["gamification"])


@router.get("/me", response_model=GamificationProfile)
async def my_gamification_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_profile(db, current_user.id)


@router.post("/checkin")
async def daily_checkin(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Record a daily login — updates streak, awards XP."""
    streak = await check_and_update_streak(db, current_user.id)
    from app.services.gamification_service import award_xp
    from app.models.gamification.xp_log import XPAction
    new_xp, leveled_up = await award_xp(db, current_user.id, XPAction.DAILY_LOGIN)
    newly_unlocked = await check_achievements(db, current_user.id)
    return {
        "streak": streak,
        "xp_awarded": 3,
        "total_xp": new_xp,
        "leveled_up": leveled_up,
        "new_achievements": newly_unlocked,
    }


@router.get("/leaderboard", response_model=list[LeaderboardEntry])
async def leaderboard(
    limit: int = Query(50, ge=5, le=100),
    db: AsyncSession = Depends(get_db),
):
    rows = await get_leaderboard(db, limit)
    return rows
