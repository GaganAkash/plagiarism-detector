"""make users.hashed_password nullable (OTP users have no password)

Revision ID: 0002
Revises: 0001
Create Date: 2026-09-04
"""
from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # SQLite has no native ALTER COLUMN; rebuild the users table with nullable password.
    with op.batch_alter_table("users") as batch_op:
        batch_op.alter_column("hashed_password", existing_type=sa.String(), nullable=True)


def downgrade() -> None:
    with op.batch_alter_table("users") as batch_op:
        batch_op.alter_column("hashed_password", existing_type=sa.String(), nullable=False)
