from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.services import ticket_service

router = APIRouter(prefix="/tickets", tags=["tickets"])


@router.get("/{rsvp_id}")
async def get_ticket(
    rsvp_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ticket_service.get_ticket(
        db, rsvp_id, current_user.id, current_user.role
    )


@router.get("/{rsvp_id}/pdf")
async def download_ticket_pdf(
    rsvp_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    pdf_bytes = await ticket_service.generate_pdf_ticket(
        db, rsvp_id, current_user.id, current_user.role
    )
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="ticket-{rsvp_id[:8]}.pdf"',
            "Cache-Control": "no-store",
        },
    )
