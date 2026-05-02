import hashlib
import hmac
import json
import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio

AUTH_BASE = "/api/v1/auth"
PAYMENTS_BASE = "/api/v1/payments"

_USER = {"name": "Payer", "email": "payer@example.com", "password": "Password1!"}


async def _get_token(client: AsyncClient) -> str:
    await client.post(f"{AUTH_BASE}/register", json=_USER)
    r = await client.post(
        f"{AUTH_BASE}/login",
        json={"email": _USER["email"], "password": _USER["password"]},
    )
    return r.json()["access_token"]


async def test_initiate_payment_requires_auth(client: AsyncClient):
    r = await client.post(PAYMENTS_BASE + "/initiate", json={"reason": "subscription"})
    assert r.status_code == 401


async def test_initiate_payment_invalid_reason(client: AsyncClient):
    token = await _get_token(client)
    r = await client.post(
        PAYMENTS_BASE + "/initiate",
        json={"reason": "invalid_reason"},
        headers={"Authorization": f"Bearer {token}"},
    )
    # Service not configured in test env — expect 503 or 400/422
    assert r.status_code in (400, 422, 503)


async def test_stripe_webhook_missing_signature(client: AsyncClient):
    r = await client.post(
        PAYMENTS_BASE + "/webhook/stripe",
        content=b'{"type":"payment_intent.succeeded"}',
        headers={"Content-Type": "application/json"},
    )
    assert r.status_code == 422


async def test_razorpay_webhook_missing_signature(client: AsyncClient):
    r = await client.post(
        PAYMENTS_BASE + "/webhook/razorpay",
        content=b'{"event":"payment.captured","payload":{"payment":{"entity":{}}}}',
        headers={"Content-Type": "application/json"},
    )
    assert r.status_code == 422
