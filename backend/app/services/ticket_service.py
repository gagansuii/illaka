from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import ForbiddenError, NotFoundError
from app.models.payment import Payment, PaymentStatus
from app.models.rsvp import RSVP
from app.models.user import UserRole
from app.utils.pdf import TicketData, generate_ticket_pdf


async def get_ticket(
    db: AsyncSession,
    rsvp_id: str,
    current_user_id: str,
    current_user_role: UserRole,
) -> dict:
    result = await db.execute(
        select(RSVP)
        .options(selectinload(RSVP.user), selectinload(RSVP.event))
        .where(RSVP.id == rsvp_id)
    )
    rsvp = result.scalar_one_or_none()
    if not rsvp:
        raise NotFoundError("Ticket not found")

    is_owner = rsvp.user_id == current_user_id
    is_privileged = current_user_role in (UserRole.ADMIN, UserRole.ORGANIZER)
    if not is_owner and not is_privileged:
        raise ForbiddenError("Access denied")

    return {
        "ticket_id": rsvp.ticket_id,
        "rsvp_id": rsvp.id,
        "event_id": rsvp.event_id,
        "created_at": rsvp.created_at.isoformat(),
        "user": {
            "id": rsvp.user.id,
            "name": rsvp.user.name,
            "email": rsvp.user.email,
        },
        "event": {
            "id": rsvp.event.id,
            "title": rsvp.event.title,
            "start_time": rsvp.event.start_time.isoformat(),
            "end_time": rsvp.event.end_time.isoformat(),
            "latitude": rsvp.event.latitude,
            "longitude": rsvp.event.longitude,
            "is_paid": rsvp.event.is_paid,
            "event_type": rsvp.event.event_type.value,
            "online_link": rsvp.event.online_link,
            "payment_qr_url": rsvp.event.payment_qr_url,
        },
    }


async def generate_pdf_ticket(
    db: AsyncSession,
    rsvp_id: str,
    current_user_id: str,
    current_user_role: UserRole,
) -> bytes:
    result = await db.execute(
        select(RSVP)
        .options(selectinload(RSVP.user), selectinload(RSVP.event))
        .where(RSVP.id == rsvp_id)
    )
    rsvp = result.scalar_one_or_none()
    if not rsvp:
        raise NotFoundError("Ticket not found")

    is_owner = rsvp.user_id == current_user_id
    is_admin = current_user_role == UserRole.ADMIN
    if not is_owner and not is_admin:
        raise ForbiddenError("Access denied")

    event = rsvp.event
    user = rsvp.user

    # Lookup payment status
    payment_status = None
    payment_amount = None
    if event.is_paid:
        pay_result = await db.execute(
            select(Payment)
            .where(
                Payment.user_id == user.id,
                Payment.event_id == event.id,
                Payment.status == PaymentStatus.CAPTURED,
            )
            .order_by(Payment.created_at.desc())
            .limit(1)
        )
        payment = pay_result.scalar_one_or_none()
        if payment:
            payment_status = payment.status.value
            payment_amount = payment.amount

    ticket_data = TicketData(
        ticket_id=rsvp.ticket_id,
        rsvp_id=rsvp.id,
        event_title=event.title,
        event_start=event.start_time.strftime("%b %d, %Y %I:%M %p"),
        event_end=event.end_time.strftime("%b %d, %Y %I:%M %p"),
        event_location=(
            "Online Event"
            if event.event_type.value == "ONLINE"
            else f"{event.latitude:.4f}, {event.longitude:.4f}"
        ),
        attendee_name=user.name,
        attendee_email=user.email,
        is_paid=event.is_paid,
        amount=payment_amount,
        payment_status=payment_status,
        payment_qr_url=event.payment_qr_url,
        is_online=event.event_type.value == "ONLINE",
        online_link=event.online_link,
    )

    return generate_ticket_pdf(ticket_data)
