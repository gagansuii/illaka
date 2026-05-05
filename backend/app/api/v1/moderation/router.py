"""
Moderation endpoints — report content/users, admin review queue.
"""
from fastapi import APIRouter, Depends, Query, Request
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.caching.redis_client import cache
from app.core.exceptions import ForbiddenError, NotFoundError, RateLimitError
from app.database.session import get_db
from app.models.base import generate_uuid
from app.models.moderation.report import Report, ReportReason, ReportStatus
from app.models.user import User, UserRole  # noqa: F401 (UserRole used in role checks)

router = APIRouter(prefix="/moderation", tags=["moderation"])


class ReportCreate(BaseModel):
    reason: ReportReason
    details: str | None = None
    reported_user_id: str | None = None
    reported_post_id: str | None = None
    reported_comment_id: str | None = None


class ReviewAction(BaseModel):
    status: ReportStatus
    moderator_note: str | None = None


@router.post("/reports", status_code=201)
async def submit_report(
    data: ReportCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not await cache.rate_limit(f"report:{current_user.id}", limit=5, window=300):
        raise RateLimitError("Too many reports submitted — please wait")

    if not any([data.reported_user_id, data.reported_post_id, data.reported_comment_id]):
        from fastapi import HTTPException
        raise HTTPException(status_code=422, detail="Must specify what you are reporting")

    report = Report(
        id=generate_uuid(),
        reporter_id=current_user.id,
        reported_user_id=data.reported_user_id,
        reported_post_id=data.reported_post_id,
        reported_comment_id=data.reported_comment_id,
        reason=data.reason,
        details=data.details,
    )
    db.add(report)
    await db.flush()
    return {"ok": True, "report_id": report.id}


@router.get("/reports")
async def list_reports(
    status: ReportStatus | None = Query(None),
    cursor: str | None = Query(None),
    limit: int = Query(20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != UserRole.ADMIN:
        raise ForbiddenError("Admin access required")

    q = select(Report).order_by(Report.created_at.desc()).limit(limit + 1)
    if status:
        q = q.where(Report.status == status)
    if cursor:
        from datetime import datetime
        try:
            cursor_dt = datetime.fromisoformat(cursor)
            q = q.where(Report.created_at < cursor_dt)
        except ValueError:
            pass

    rows = (await db.execute(q)).scalars().all()
    has_more = len(rows) > limit
    rows = rows[:limit]
    next_cursor = rows[-1].created_at.isoformat() if (has_more and rows) else None
    return {"reports": rows, "next_cursor": next_cursor, "has_more": has_more}


@router.patch("/reports/{report_id}")
async def review_report(
    report_id: str,
    data: ReviewAction,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != UserRole.ADMIN:
        raise ForbiddenError("Admin access required")

    report = (await db.execute(select(Report).where(Report.id == report_id))).scalar_one_or_none()
    if not report:
        raise NotFoundError("Report not found")

    report.status = data.status
    report.reviewed_by = current_user.id
    if data.moderator_note:
        report.moderator_note = data.moderator_note
    await db.flush()
    return {"ok": True}
