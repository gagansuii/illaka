from pydantic import BaseModel


class InitiatePaymentRequest(BaseModel):
    reason: str
    currency: str = "INR"
    event_id: str | None = None


class InitiatePaymentResponse(BaseModel):
    order_id: str
    key_id: str
    amount: int
    currency: str
    upi_vpa: str | None = None
    provider: str = "razorpay"


class StripeCheckoutRequest(BaseModel):
    reason: str
    event_id: str | None = None
    success_url: str
    cancel_url: str


class StripeCheckoutResponse(BaseModel):
    checkout_url: str
    session_id: str


class PaymentRecord(BaseModel):
    id: str
    user_id: str
    event_id: str | None = None
    provider: str
    provider_ref: str | None = None
    amount: int
    currency: str
    status: str
    reason: str | None = None
    created_at: object

    model_config = {"from_attributes": True}
