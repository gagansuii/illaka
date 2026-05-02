from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.payment import Payment, PaymentStatus


async def get_by_id(db: AsyncSession, payment_id: str) -> Payment | None:
    result = await db.execute(select(Payment).where(Payment.id == payment_id))
    return result.scalar_one_or_none()


async def get_by_provider_ref(db: AsyncSession, provider_ref: str) -> Payment | None:
    result = await db.execute(
        select(Payment).where(Payment.provider_ref == provider_ref)
    )
    return result.scalar_one_or_none()


async def get_by_stripe_intent(
    db: AsyncSession, intent_id: str
) -> Payment | None:
    result = await db.execute(
        select(Payment).where(Payment.stripe_payment_intent_id == intent_id)
    )
    return result.scalar_one_or_none()


async def get_by_stripe_session(
    db: AsyncSession, session_id: str
) -> Payment | None:
    result = await db.execute(
        select(Payment).where(Payment.stripe_checkout_session_id == session_id)
    )
    return result.scalar_one_or_none()


async def create(db: AsyncSession, **kwargs) -> Payment:
    payment = Payment(**kwargs)
    db.add(payment)
    await db.flush()
    await db.refresh(payment)
    return payment


async def update_status(
    db: AsyncSession,
    payment_id: str,
    status: PaymentStatus,
) -> None:
    from sqlalchemy import update
    await db.execute(
        update(Payment).where(Payment.id == payment_id).values(status=status)
    )
