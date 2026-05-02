from fastapi import APIRouter, Depends, Header, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.payment import (
    InitiatePaymentRequest,
    InitiatePaymentResponse,
    StripeCheckoutRequest,
    StripeCheckoutResponse,
)
from app.services import payment_service

router = APIRouter(prefix="/payments", tags=["payments"])


# ─── Razorpay ───────────────────────────────────────────────────────────────

@router.post("/initiate", response_model=InitiatePaymentResponse)
async def initiate_payment(
    body: InitiatePaymentRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await payment_service.initiate_razorpay(
        db,
        user_id=current_user.id,
        reason=body.reason,
        currency=body.currency,
        event_id=body.event_id,
    )


@router.post("/webhook/razorpay", status_code=200)
async def razorpay_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
    x_razorpay_signature: str | None = Header(default=None, alias="x-razorpay-signature"),
):
    payload = await request.body()
    if not x_razorpay_signature:
        from app.core.exceptions import ValidationError
        raise ValidationError("Missing webhook signature")

    body = await request.json()
    await payment_service.handle_razorpay_webhook(
        db, payload, x_razorpay_signature, body
    )
    return {"received": True}


# ─── Stripe ─────────────────────────────────────────────────────────────────

@router.post("/stripe/checkout", response_model=StripeCheckoutResponse)
async def stripe_checkout(
    body: StripeCheckoutRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await payment_service.initiate_stripe_checkout(
        db,
        user_id=current_user.id,
        reason=body.reason,
        event_id=body.event_id,
        success_url=body.success_url,
        cancel_url=body.cancel_url,
    )
    return result


@router.post("/webhook/stripe", status_code=200)
async def stripe_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
    stripe_signature: str | None = Header(default=None, alias="stripe-signature"),
):
    payload = await request.body()
    if not stripe_signature:
        from app.core.exceptions import ValidationError
        raise ValidationError("Missing Stripe signature")

    await payment_service.handle_stripe_webhook(db, payload, stripe_signature)
    return {"received": True}
