"""Initial schema — all 6 tables

Revision ID: 0001
Revises:
Create Date: 2026-06-20
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── users ────────────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", sa.String(50), nullable=False, server_default="hr_admin"),
        sa.UniqueConstraint("email", name="uq_users_email"),
    )
    op.create_index("ix_users_id", "users", ["id"])
    op.create_index("ix_users_email", "users", ["email"])

    # ── candidates ───────────────────────────────────────────────────────────
    op.create_table(
        "candidates",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("candidate_code", sa.String(20), nullable=True),
        sa.Column("full_name", sa.String(200), nullable=False),
        sa.Column("dob", sa.Date(), nullable=True),
        sa.Column("mobile", sa.String(20), nullable=True),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("address", sa.String(500), nullable=True),
        sa.Column("qualification", sa.String(200), nullable=True),
        sa.Column("university", sa.String(200), nullable=True),
        sa.Column("passing_year", sa.Integer(), nullable=True),
        sa.Column("percentage", sa.Numeric(5, 2), nullable=True),
        sa.Column("company_name", sa.String(200), nullable=True),
        sa.Column("years_experience", sa.Numeric(4, 1), nullable=True),
        sa.Column("current_ctc", sa.Numeric(12, 2), nullable=True),
        sa.Column("expected_ctc", sa.Numeric(12, 2), nullable=True),
        sa.Column("department_applied", sa.String(100), nullable=True),
        sa.Column(
            "status",
            sa.String(30),
            nullable=False,
            server_default="New Application",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_candidates_id", "candidates", ["id"])
    op.create_index("ix_candidates_candidate_code", "candidates", ["candidate_code"], unique=True)
    op.create_index("ix_candidates_email", "candidates", ["email"])

    # ── interviews ───────────────────────────────────────────────────────────
    op.create_table(
        "interviews",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "candidate_id",
            sa.Integer(),
            sa.ForeignKey("candidates.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("interview_date", sa.Date(), nullable=True),
        sa.Column("panel", sa.String(300), nullable=True),
        sa.Column("department", sa.String(100), nullable=True),
        sa.Column("remarks", sa.Text(), nullable=True),
    )
    op.create_index("ix_interviews_id", "interviews", ["id"])
    op.create_index("ix_interviews_candidate_id", "interviews", ["candidate_id"])

    # ── documents ────────────────────────────────────────────────────────────
    op.create_table(
        "documents",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "candidate_id",
            sa.Integer(),
            sa.ForeignKey("candidates.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("doc_type", sa.String(30), nullable=False),
        sa.Column("status", sa.String(10), nullable=False, server_default="Pending"),
        sa.Column("file_path", sa.String(500), nullable=True),
    )
    op.create_index("ix_documents_id", "documents", ["id"])
    op.create_index("ix_documents_candidate_id", "documents", ["candidate_id"])

    # ── medical_records ──────────────────────────────────────────────────────
    op.create_table(
        "medical_records",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "candidate_id",
            sa.Integer(),
            sa.ForeignKey("candidates.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "medical_status",
            sa.String(20),
            nullable=False,
            server_default="Sent for medical",
        ),
    )
    op.create_index("ix_medical_records_id", "medical_records", ["id"])
    op.create_index("ix_medical_records_candidate_id", "medical_records", ["candidate_id"])

    # ── joining_records ──────────────────────────────────────────────────────
    op.create_table(
        "joining_records",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "candidate_id",
            sa.Integer(),
            sa.ForeignKey("candidates.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("joining_date", sa.Date(), nullable=True),
        sa.Column("department", sa.String(100), nullable=True),
        sa.Column("designation", sa.String(100), nullable=True),
        sa.Column("reporting_manager", sa.String(200), nullable=True),
        sa.Column("employee_code", sa.String(50), nullable=True),
        sa.Column("status", sa.String(10), nullable=False, server_default="Pending"),
    )
    op.create_index("ix_joining_records_id", "joining_records", ["id"])
    op.create_index("ix_joining_records_candidate_id", "joining_records", ["candidate_id"])


def downgrade() -> None:
    op.drop_table("joining_records")
    op.drop_table("medical_records")
    op.drop_table("documents")
    op.drop_table("interviews")
    op.drop_table("candidates")
    op.drop_table("users")
