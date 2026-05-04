"""Add address field to events

Revision ID: 002
Revises: 001
Create Date: 2025-01-01 00:01:00.000000
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "events",
        sa.Column("address", sa.String(500), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("events", "address")
