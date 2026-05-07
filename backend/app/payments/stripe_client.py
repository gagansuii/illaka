"""
Stripe payment integration.
Handles Checkout Sessions, Payment Intents, Subscriptions, Refunds, and Webhooks.
"""
import logging

import stripe

from app.core.config import settings
from app.core.exceptions import PaymentError, ServiceUnavailableError

logger = logging.getLogger(__name__)

# ─── Client ────────────────────────────────────────────────────────────────

def _get_stripe() -> stripe.Stripe:
    if not settings.stripe_configured:
        raise ServiceUnavailableError("Stripe is not configured")
    stripe.api_key = settings.STRIPE_SECRET_KEY
    return stripe


# ─── Customer ──────────────────────────────────────────────────────────────

async def get_or_create_customer(
    user_id: str,
    email: str,
    name: str,
    existing_customer_id: str | None = None,
) -> str:
    """Returns a Stripe customer ID."""
    s = _get_stripe()
    if existing_customer_id:
        return existing_customer_id
    try:
        customer = s.Customer.create(
            email=email,
            name=name,
            metadata={"user_id": user_id},
        )
        return customer.id
    except stripe.StripeError as exc:
        raise PaymentError(f"Failed to create Stripe customer: {exc}") from exc


# ─── Checkout Session ───────────────────────────────────────────────────────

async def create_checkout_session(
    customer_id: str,
    amount_cents: int,
    currency: str,
    reason: str,
    event_id: str | None,
    success_url: str,
    cancel_url: str,
    metadata: dict | None = None,
) -> dict:
    """Creates a Stripe Checkout Session and returns {session_id, url}."""
    s = _get_stripe()
    meta = {
        "reason": reason,
        **({"event_id": event_id} if event_id else {}),
        **(metadata or {}),
    }
    try:
        session = s.checkout.Session.create(
            customer=customer_id,
            payment_method_types=["card"],
            line_items=[
                {
                    "price_data": {
                        "currency": currency.lower(),
                        "product_data": {"name": f"Ilaaka — {reason.replace('_', ' ').title()}"},
                        "unit_amount": amount_cents,
                    },
                    "quantity": 1,
                }
            ],
            mode="payment",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata=meta,
        )
        return {"session_id": session.id, "checkout_url": session.url}
    except stripe.StripeError as exc:
        raise PaymentError(f"Failed to create checkout session: {exc}") from exc


async def create_subscription_checkout(
    customer_id: str,
    price_id: str,
    success_url: str,
    cancel_url: str,
    metadata: dict | None = None,
) -> dict:
    """Creates a subscription checkout session."""
    s = _get_stripe()
    try:
        session = s.checkout.Session.create(
            customer=customer_id,
            payment_method_types=["card"],
            line_items=[{"price": price_id, "quantity": 1}],
            mode="subscription",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata=metadata or {},
        )
        return {"session_id": session.id, "checkout_url": session.url}
    except stripe.StripeError as exc:
        raise PaymentError(f"Failed to create subscription checkout: {exc}") from exc


# ─── Payment Intent ─────────────────────────────────────────────────────────

async def create_payment_intent(
    customer_id: str,
    amount_cents: int,
    currency: str,
    metadata: dict | None = None,
) -> dict:
    s = _get_stripe()
    try:
        intent = s.PaymentIntent.create(
            customer=customer_id,
            amount=amount_cents,
            currency=currency.lower(),
            automatic_payment_methods={"enabled": True},
            metadata=metadata or {},
        )
        return {
            "payment_intent_id": intent.id,
            "client_secret": intent.client_secret,
            "status": intent.status,
        }
    except stripe.StripeError as exc:
        raise PaymentError(f"Failed to create payment intent: {exc}") from exc


# ─── Refunds ────────────────────────────────────────────────────────────────

async def create_refund(payment_intent_id: str, amount_cents: int | None = None) -> dict:
    s = _get_stripe()
    try:
        kwargs: dict = {"payment_intent": payment_intent_id}
        if amount_cents:
            kwargs["amount"] = amount_cents
        refund = s.Refund.create(**kwargs)
        return {"refund_id": refund.id, "status": refund.status}
    except stripe.StripeError as exc:
        raise PaymentError(f"Refund failed: {exc}") from exc


# ─── Webhook verification ───────────────────────────────────────────────────

def verify_webhook(payload: bytes, sig_header: str) -> stripe.Event:
    """Verifies Stripe webhook signature and returns parsed event."""
    if not settings.STRIPE_WEBHOOK_SECRET:
        raise ServiceUnavailableError("Stripe webhook secret not configured")
    try:
        return stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except stripe.SignatureVerificationError as exc:
        raise PaymentError(f"Invalid webhook signature: {exc}") from exc
    except Exception as exc:
        raise PaymentError(f"Webhook parse error: {exc}") from exc
