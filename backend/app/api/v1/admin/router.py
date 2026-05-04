from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import require_admin
from app.database.session import get_db
from app.models.user import User, UserRole
from app.repositories import event_repo, user_repo
from app.schemas.common import OkResponse

router = APIRouter(prefix="/admin", tags=["admin"])

AdminUser = Depends(require_admin)


# ─── Events ─────────────────────────────────────────────────────────────────

@router.get("/events")
async def list_all_events(
    page: int = Query(default=0, ge=0),
    current_user: User = AdminUser,
    db: AsyncSession = Depends(get_db),
):
    events, total = await event_repo.list_paginated(db, page=page, page_size=50)
    return {
        "events": [
            {
                "id": e.id,
                "title": e.title,
                "visibility": e.visibility.value,
                "organizer_id": e.organizer_id,
                "start_time": e.start_time.isoformat(),
                "end_time": e.end_time.isoformat(),
                "engagement_score": e.engagement_score,
                "capacity": e.capacity,
                "created_at": e.created_at.isoformat(),
            }
            for e in events
        ],
        "total": total,
        "page": page,
        "page_size": 50,
    }


@router.delete("/events/{event_id}", response_model=OkResponse)
async def admin_delete_event(
    event_id: str,
    current_user: User = AdminUser,
    db: AsyncSession = Depends(get_db),
):
    from app.services.event_service import _sanitize_event  # noqa: F401 — ensure cache cleared
    from app.caching.events_cache import events_cache
    await event_repo.delete_event(db, event_id)
    await events_cache.clear()
    return {"ok": True}


# ─── Users ──────────────────────────────────────────────────────────────────

@router.get("/users")
async def list_all_users(
    page: int = Query(default=0, ge=0),
    current_user: User = AdminUser,
    db: AsyncSession = Depends(get_db),
):
    users, total = await user_repo.list_paginated(db, page=page, page_size=50)
    return {
        "users": [
            {
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "role": u.role.value,
                "created_at": u.created_at.isoformat(),
            }
            for u in users
        ],
        "total": total,
        "page": page,
        "page_size": 50,
    }


class _UpdateRoleBody:
    pass


from pydantic import BaseModel


class UpdateRoleRequest(BaseModel):
    role: UserRole


@router.patch("/users/{user_id}")
async def admin_update_user(
    user_id: str,
    body: UpdateRoleRequest,
    current_user: User = AdminUser,
    db: AsyncSession = Depends(get_db),
):
    await user_repo.update_fields(db, user_id, role=body.role)
    user = await user_repo.get_by_id(db, user_id)
    return {"user": {"id": user.id, "email": user.email, "role": user.role.value}}


@router.delete("/users/{user_id}", response_model=OkResponse)
async def admin_delete_user(
    user_id: str,
    current_user: User = AdminUser,
    db: AsyncSession = Depends(get_db),
):
    await user_repo.delete(db, user_id)
    return {"ok": True}
