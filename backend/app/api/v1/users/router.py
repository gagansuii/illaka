from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.user import UpdateLocationRequest, UpdateProfileRequest
from app.services import user_service

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/profile", status_code=200)
async def update_profile(
    body: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await user_service.update_profile(
        db, current_user.id, body.name, body.radius_preference
    )
    return {"ok": True}


@router.post("/location", status_code=200)
async def update_location(
    body: UpdateLocationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await user_service.update_location(
        db, current_user.id, body.latitude, body.longitude, body.radius
    )
    return {"ok": True}


@router.get("/my-events")
async def my_events(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await user_service.get_my_events(db, current_user.id)


@router.get("/members")
async def members(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await user_service.get_members(db)
