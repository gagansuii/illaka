import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import ForbiddenError, NotFoundError, PaymentError
from app.models.payment import Payment, PaymentProvider, PaymentReason, PaymentStatus
from app.repositories import event_repo, payment_repo, user_repo

logger = logging.getLogger(__name__)

_REASON_MAP = {
    "subscription": PaymentReason.SUBSCRIPTION,
    "hosting_fee": PaymentReason.HOSTING_FEE,
    "promotion": PaymentReason.PROMOTION,
    "ticket": PaymentReason.TICKET,
}


# ─── Razorpay ───────────────────────────────────────────────────────────────

async def initiate_razorpay(
    db: AsyncSession,
    user_id: str,
    reason: str,
    currency: str = "INR",
    event_id: str | None = None,
) -> dict:
    from app.payments.razorpay_client import create_order, get_amount_for_reason

    if not settings.razorpay_configured:
        raise PaymentError("Payment gateway not configured")

    if reason not in _REASON_MAP:
        raise PaymentError(f"Invalid payment reason: {reason}")

    # Validate event ownership for event-linked reasons
    if event_id:
        event = await event_repo.get_by_id(db, event_id)
        if not event:
            raise NotFoundError("Event not found")
        if event.organizer_id != user_id:
            raise ForbiddenError("Not authorized for this event")

    amount = get_amount_for_reason(reason)
    order = await create_order(amount, currency)

    payment = await payment_repo.create(
        db,
        user_id=user_id,
        event_id=event_id,
        provider=PaymentProvider.RAZORPAY,
        provider_ref=order["order_id"],
        amount=amount,
        currency=currency,
        status=PaymentStatus.CREATED,
        reason=_REASON_MAP[reason],
    )

    return {
        "order_id": order["order_id"],
        "key_id": order["key_id"],
        "amount": amount,
        "currency": currency,
        "upi_vpa": order.get("upi_vpa"),
        "provider": "razorpay",
    }


async def handle_razorpay_webhook(
    db: AsyncSession,
    payload: bytes,
    signature: str,
    body: dict,
) -> None:
    from app.payments.razorpay_client import verify_webhook_signature

    if not verify_webhook_signature(payload, signature):
        raise PaymentError("Invalid webhook signature")

    entity = body.get("payload", {}).get("payment", {}).get("entity", {})
    order_id = entity.get("order_id")
    status_str = entity.get("status")
    webhook_amount = entity.get("amount")

    if not order_id:
        return

    payment = await payment_repo.get_by_provider_ref(db, order_id)
    if not payment:
        logger.warning("Razorpay webhook for unknown order %s", order_id)
        return

    if webhook_amount and int(webhook_amount) != payment.amount:
        logger.error("Amount mismatch for order %s", order_id)
        return

    _STATUS_MAP = {
        "created": PaymentStatus.CREATED,
        "authorized": PaymentStatus.AUTHORIZED,
        "captured": PaymentStatus.CAPTURED,
        "refunded": PaymentStatus.REFUNDED,
        "failed": PaymentStatus.FAILED,
    }
    new_status = _STATUS_MAP.get(status_str)
    if new_status:
        await payment_repo.update_status(db, payment.id, new_status)


# ─── Stripe ─────────────────────────────────────────────────────────────────

async def initiate_stripe_checkout(
    db: AsyncSession,
    user_id: str,
    reason: str,
    event_id: str | None,
    success_url: str,
    cancel_url: str,
) -> dict:
    from app.payments.stripe_client import (
        create_checkout_session,
        create_subscription_checkout,
        get_or_create_customer,
    )

    if not settings.stripe_configured:
        raise PaymentError("Stripe is not configured")

    user = await user_repo.get_by_id(db, user_id)
    if not user:
        raise NotFoundError("User not found")

    # Get or create Stripe customer
    customer_id = await get_or_create_customer(
        user_id=user.id,
        email=user.email,
        name=user.name,
        existing_customer_id=user.stripe_customer_id,
    )
    if not user.stripe_customer_id:
        await user_repo.update_fields(db, user_id, stripe_customer_id=customer_id)

    amount_map = {
        "subscription": settings.SUBSCRIPTION_PRICE,
        "hosting_fee": settings.HOSTING_FEE_AMOUNT,
        "promotion": settings.PROMOTION_PRICE,
    }
    amount = amount_map.get(reason)
    if amount is None:
        raise PaymentError(f"Unknown payment reason: {reason}")

    # Use subscription flow for recurring plans
    if reason == "subscription" and settings.STRIPE_SUBSCRIPTION_PRICE_ID:
        session = await create_subscription_checkout(
            customer_id=customer_id,
            price_id=settings.STRIPE_SUBSCRIPTION_PRICE_ID,
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={"user_id": user_id},
        )
    else:
        session = await create_checkout_session(
            customer_id=customer_id,
            amount_cents=amount,
            currency="inr",
            reason=reason,
            event_id=event_id,
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={"user_id": user_id},
        )

    payment = await payment_repo.create(
        db,
        user_id=user_id,
        event_id=event_id,
        provider=PaymentProvider.STRIPE,
        stripe_checkout_session_id=session["session_id"],
        amount=amount,
        currency="INR",
        status=PaymentStatus.CREATED,
        reason=_REASON_MAP.get(reason),
    )

    return session


async def handle_stripe_webhook(db: AsyncSession, payload: bytes, sig_header: str) -> None:
    from app.payments.stripe_client import verify_webhook

    event = verify_webhook(payload, sig_header)
    event_type = event["type"]
    data_obj = event["data"]["object"]

    handlers = {
        "payment_intent.succeeded": _handle_pi_succeeded,
        "payment_intent.payment_failed": _handle_pi_failed,
        "checkout.session.completed": _handle_checkout_completed,
        "invoice.payment_succeeded": _handle_invoice_succeeded,
        "customer.subscription.updated": _handle_sub_updated,
        "customer.subscription.deleted": _handle_sub_deleted,
    }

    handler = handlers.get(event_type)
    if handler:
        await handler(db, data_obj)
    else:
        logger.debug("Unhandled Stripe event: %s", event_type)


async def _handle_pi_succeeded(db: AsyncSession, obj: dict) -> None:
    pi_id = obj.get("id")
    payment = await payment_repo.get_by_stripe_intent(db, pi_id)
    if payment:
        await payment_repo.update_status(db, payment.id, PaymentStatus.SUCCEEDED)


async def _handle_pi_failed(db: AsyncSession, obj: dict) -> None:
    pi_id = obj.get("id")
    payment = await payment_repo.get_by_stripe_intent(db, pi_id)
    if payment:
        await payment_repo.update_status(db, payment.id, PaymentStatus.FAILED)


async def _handle_checkout_completed(db: AsyncSession, obj: dict) -> None:
    session_id = obj.get("id")
    payment = await payment_repo.get_by_stripe_session(db, session_id)
    if payment:
        await payment_repo.update_status(db, payment.id, PaymentStatus.CAPTURED)
        # Update user subscription_type if applicable
        if payment.reason == PaymentReason.SUBSCRIPTION:
            await user_repo.update_fields(
                db, payment.user_id, subscription_type="premium"
            )


async def _handle_invoice_succeeded(db: AsyncSession, obj: dict) -> None:
    sub_id = obj.get("subscription")
    if not sub_id:
        return
    from sqlalchemy import select, update
    from app.models.subscription import Subscription, SubscriptionStatus
    await db.execute(
        update(Subscription)
        .where(Subscription.stripe_subscription_id == sub_id)
        .values(status=SubscriptionStatus.ACTIVE)
    )


async def _handle_sub_updated(db: AsyncSession, obj: dict) -> None:
    sub_id = obj.get("id")
    status_str = obj.get("status", "")
    from app.models.subscription import Subscription, SubscriptionStatus
    _MAP = {
        "active": SubscriptionStatus.ACTIVE,
        "canceled": SubscriptionStatus.CANCELED,
        "past_due": SubscriptionStatus.PAST_DUE,
        "trialing": SubscriptionStatus.TRIALING,
    }
    status = _MAP.get(status_str)
    if status and sub_id:
        from sqlalchemy import update
        await db.execute(
            update(Subscription)
            .where(Subscription.stripe_subscription_id == sub_id)
            .values(status=status)
        )


async def _handle_sub_deleted(db: AsyncSession, obj: dict) -> None:
    sub_id = obj.get("id")
    if sub_id:
        from sqlalchemy import update
        from app.models.subscription import Subscription, SubscriptionStatus
        await db.execute(
            update(Subscription)
            .where(Subscription.stripe_subscription_id == sub_id)
            .values(status=SubscriptionStatus.CANCELED)
        )
