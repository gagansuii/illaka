import enum

from sqlalchemy import Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, generate_uuid


class PaymentStatus(str, enum.Enum):
    CREATED = "created"
    AUTHORIZED = "authorized"
    CAPTURED = "captured"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    REFUNDED = "refunded"
    CANCELED = "canceled"


class PaymentProvider(str, enum.Enum):
    RAZORPAY = "razorpay"
    STRIPE = "stripe"


class PaymentReason(str, enum.Enum):
    SUBSCRIPTION = "subscription"
    HOSTING_FEE = "hosting_fee"
    PROMOTION = "promotion"
    TICKET = "ticket"


class Payment(Base, TimestampMixin):
    __tablename__ = "payments"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=generate_uuid
    )
    user_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id", ondelete="SET NULL"), nullable=False, index=True
    )
    event_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("events.id", ondelete="SET NULL"), nullable=True, index=True
    )

    provider: Mapped[PaymentProvider] = mapped_column(
        Enum(PaymentProvider), nullable=False
    )
    # Provider-specific references
    provider_ref: Mapped[str | None] = mapped_column(
        String(255), nullable=True, index=True
    )
    # Stripe-specific
    stripe_payment_intent_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    stripe_checkout_session_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    stripe_subscription_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    stripe_invoice_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="INR", nullable=False)
    status: Mapped[PaymentStatus] = mapped_column(
        Enum(PaymentStatus), default=PaymentStatus.CREATED, nullable=False
    )
    reason: Mapped[PaymentReason | None] = mapped_column(
        Enum(PaymentReason), nullable=True
    )

    user: Mapped["User"] = relationship("User", back_populates="payments")  # noqa: F821
    event: Mapped["Event | None"] = relationship("Event", back_populates="payments")  # noqa: F821
