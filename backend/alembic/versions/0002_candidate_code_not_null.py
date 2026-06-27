"""Make candidates.candidate_code NOT NULL

Revision ID: 0002
Revises: 0001
Create Date: 2026-06-20

SQLite does not support ALTER COLUMN directly, so we use the recommended
batch migration approach via op.batch_alter_table.

Steps:
  1. Backfill any rows that somehow have a NULL candidate_code (shouldn't
     exist in a fresh install, but guards against manual testing artefacts).
  2. Alter the column to NOT NULL using batch mode.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Step 1 — backfill NULLs so the NOT NULL constraint can apply.
    # Uses a temporary placeholder format to avoid touching the UNIQUE index.
    conn = op.get_bind()
    rows = conn.execute(
        sa.text("SELECT id FROM candidates WHERE candidate_code IS NULL")
    ).fetchall()
    for (row_id,) in rows:
        conn.execute(
            sa.text(
                "UPDATE candidates SET candidate_code = :code WHERE id = :id"
            ),
            {"code": f"LUP-TAR-BACKFILL-{row_id:03d}", "id": row_id},
        )

    # Step 2 — alter column to NOT NULL using batch mode (required for SQLite).
    with op.batch_alter_table("candidates", schema=None) as batch_op:
        batch_op.alter_column(
            "candidate_code",
            existing_type=sa.String(20),
            nullable=False,
        )


def downgrade() -> None:
    with op.batch_alter_table("candidates", schema=None) as batch_op:
        batch_op.alter_column(
            "candidate_code",
            existing_type=sa.String(20),
            nullable=True,
        )
