"""
Razorpay compatibility layer — preserved during the Stripe migration transition.
"""
import hashlib
import hmac
import logging

import razorpay

from app.core.config import settings
from app.core.exceptions import PaymentError, ServiceUnavailableError

logger = logging.getLogger(__name__)


def _get_client() -> razorpay.Client:
    if not settings.razorpay_configured:
        raise ServiceUnavailableError("Razorpay is not configured")
    return razorpay.Client(
        auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
    )


async def create_order(amount_paise: int, currency: str = "INR") -> dict:
    """Creates a Razorpay order. Returns {id, amount, currency}."""
    client = _get_client()
    try:
        order = client.order.create(
            {
                "amount": amount_paise,
                "currency": currency,
                "payment_capture": 1,
            }
        )
        return {
            "order_id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"],
            "key_id": settings.RAZORPAY_KEY_ID,
            "upi_vpa": settings.RAZORPAY_UPI_VPA,
        }
    except Exception as exc:
        raise PaymentError(f"Razorpay order creation failed: {exc}") from exc


def verify_webhook_signature(
    payload_body: bytes, signature: str
) -> bool:
    """Timing-safe HMAC-SHA256 webhook verification."""
    if not settings.RAZORPAY_WEBHOOK_SECRET:
        return False
    expected = hmac.new(
        settings.RAZORPAY_WEBHOOK_SECRET.encode(),
        payload_body,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


def get_amount_for_reason(reason: str) -> int:
    """Maps payment reason to paise amount."""
    mapping = {
        "subscription": settings.SUBSCRIPTION_PRICE,
        "hosting_fee": settings.HOSTING_FEE_AMOUNT,
        "promotion": settings.PROMOTION_PRICE,
    }
    amount = mapping.get(reason)
    if amount is None:
        raise PaymentError(f"Unknown payment reason: {reason}")
    return amount
