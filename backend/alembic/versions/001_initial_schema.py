"""Initial schema with PostGIS

Revision ID: 001
Revises:
Create Date: 2025-01-01 00:00:00.000000
"""
from typing import Sequence, Union

import geoalchemy2
import sqlalchemy as sa
from alembic import op

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enable PostGIS
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")

    op.create_table(
        "users",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("password", sa.String(255), nullable=False),
        sa.Column("role", sa.Enum("USER", "ORGANIZER", "ADMIN", name="userrole"), nullable=False, server_default="USER"),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("radius_preference", sa.Integer(), nullable=False, server_default="5000"),
        sa.Column("subscription_type", sa.String(50), nullable=True),
        sa.Column("stripe_customer_id", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "events",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("banner_url", sa.String(500), nullable=True),
        sa.Column("badge_icon", sa.String(500), nullable=True),
        sa.Column("latitude", sa.Float(), nullable=False),
        sa.Column("longitude", sa.Float(), nullable=False),
        sa.Column(
            "location",
            geoalchemy2.Geography(geometry_type="POINT", srid=4326),
            nullable=True,
        ),
        sa.Column("start_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("visibility", sa.Enum("PUBLIC", "PRIVATE", name="eventvisibility"), nullable=False, server_default="PUBLIC"),
        sa.Column("capacity", sa.Integer(), nullable=False),
        sa.Column("organizer_id", sa.String(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("is_paid", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("ticket_price", sa.Float(), nullable=True),
        sa.Column("payment_qr_url", sa.String(500), nullable=True),
        sa.Column("engagement_score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("share_token", sa.String(255), nullable=True, unique=True),
        sa.Column("event_type", sa.Enum("PHYSICAL", "ONLINE", name="eventtype"), nullable=False, server_default="PHYSICAL"),
        sa.Column("online_link", sa.String(500), nullable=True),
        sa.Column("link_share_mode", sa.Enum("INVITE_ONLY", "PUBLIC", name="linksharemode"), nullable=False, server_default="INVITE_ONLY"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_events_organizer_id", "events", ["organizer_id"])
    op.create_index("ix_events_start_time", "events", ["start_time"])
    op.create_index("ix_events_visibility", "events", ["visibility"])
    op.create_index("ix_events_engagement", "events", ["engagement_score"])
    op.create_index("idx_events_location", "events", ["location"], postgresql_using="gist")

    op.create_table(
        "rsvps",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("ticket_id", sa.String(), nullable=False, unique=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("event_id", sa.String(), sa.ForeignKey("events.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("user_id", "event_id", name="uq_rsvp_user_event"),
    )

    op.create_table(
        "likes",
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("event_id", sa.String(), sa.ForeignKey("events.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "shares",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("event_id", sa.String(), sa.ForeignKey("events.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "attendances",
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("event_id", sa.String(), sa.ForeignKey("events.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "payments",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=False),
        sa.Column("event_id", sa.String(), sa.ForeignKey("events.id", ondelete="SET NULL"), nullable=True),
        sa.Column("provider", sa.Enum("razorpay", "stripe", name="paymentprovider"), nullable=False),
        sa.Column("provider_ref", sa.String(255), nullable=True),
        sa.Column("stripe_payment_intent_id", sa.String(255), nullable=True),
        sa.Column("stripe_checkout_session_id", sa.String(255), nullable=True),
        sa.Column("stripe_subscription_id", sa.String(255), nullable=True),
        sa.Column("stripe_invoice_id", sa.String(255), nullable=True),
        sa.Column("amount", sa.Integer(), nullable=False),
        sa.Column("currency", sa.String(3), nullable=False, server_default="INR"),
        sa.Column("status", sa.Enum("created","authorized","captured","succeeded","failed","refunded","canceled", name="paymentstatus"), nullable=False, server_default="created"),
        sa.Column("reason", sa.Enum("subscription","hosting_fee","promotion","ticket", name="paymentreason"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "subscriptions",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("status", sa.Enum("active","inactive","canceled","past_due","trialing", name="subscriptionstatus"), nullable=False),
        sa.Column("plan", sa.String(100), nullable=True),
        sa.Column("stripe_subscription_id", sa.String(255), nullable=True),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ends_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "password_reset_tokens",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("token", sa.String(255), nullable=False, unique=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used", sa.Boolean(), nullable=False, server_default="false"),
    )

    op.create_table(
        "reminder_logs",
        sa.Column("event_id", sa.String(), sa.ForeignKey("events.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("type", sa.Enum("1d","6h","1h", name="remindertype"), primary_key=True),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("reminder_logs")
    op.drop_table("password_reset_tokens")
    op.drop_table("subscriptions")
    op.drop_table("payments")
    op.drop_table("attendances")
    op.drop_table("shares")
    op.drop_table("likes")
    op.drop_table("rsvps")
    op.drop_table("events")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS remindertype")
    op.execute("DROP TYPE IF EXISTS subscriptionstatus")
    op.execute("DROP TYPE IF EXISTS paymentreason")
    op.execute("DROP TYPE IF EXISTS paymentstatus")
    op.execute("DROP TYPE IF EXISTS paymentprovider")
    op.execute("DROP TYPE IF EXISTS linksharemode")
    op.execute("DROP TYPE IF EXISTS eventtype")
    op.execute("DROP TYPE IF EXISTS eventvisibility")
    op.execute("DROP TYPE IF EXISTS userrole")
