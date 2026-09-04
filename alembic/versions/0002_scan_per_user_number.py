"""add user_id and per-user scan_number to scans

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
    with op.batch_alter_table("scans") as batch_op:
        batch_op.add_column(sa.Column("user_id", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("scan_number", sa.Integer(), nullable=True))
    # backfill user_id from the owning document
    op.execute(
        "UPDATE scans SET user_id = "
        "(SELECT user_id FROM documents WHERE documents.id = scans.document_id)"
    )
    # backfill per-user scan_number (ordinal by scan id within the user)
    op.execute(
        "UPDATE scans SET scan_number = "
        "(SELECT COUNT(*) FROM scans s2 WHERE s2.user_id = scans.user_id AND s2.id <= scans.id)"
    )


def downgrade() -> None:
    with op.batch_alter_table("scans") as batch_op:
        batch_op.drop_column("scan_number")
        batch_op.drop_column("user_id")
