"""
Dashboard router — HR only.

Endpoint:
  GET /dashboard/stats — funnel counts, department breakdown, recent activity feed
"""

import logging
from datetime import datetime
from typing import Any, Dict, List

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_hr_role
from app.models.candidate import Candidate, CandidateStatus
from app.models.joining import JoiningRecord, JoiningStatus
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/dashboard", tags=["dashboard"], redirect_slashes=False)

# Status display order in the funnel
FUNNEL_ORDER = [
    CandidateStatus.new_application.value,
    CandidateStatus.shortlisted.value,
    CandidateStatus.interview_scheduled.value,
    CandidateStatus.selected.value,
    CandidateStatus.rejected.value,
    CandidateStatus.hold.value,
]


@router.get(
    "/stats",
    response_model=Dict[str, Any],
    summary="Aggregated dashboard stats (HR only)",
)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    _: User = Depends(require_hr_role),
) -> Dict[str, Any]:
    """
    Returns:
      - totals: count per candidate status + Joined (from joining_records)
      - departments: candidate count per department
      - recent_activity: last 10 candidates by created_at desc
    """

    # ── Funnel totals ────────────────────────────────────────────────────────
    status_rows = (
        db.query(Candidate.status, func.count(Candidate.id))
        .group_by(Candidate.status)
        .all()
    )
    totals: Dict[str, int] = {s: 0 for s in FUNNEL_ORDER}
    totals["Joined"] = 0

    for status_val, cnt in status_rows:
        if status_val in totals:
            totals[status_val] = cnt

    # Joined = joining_records with status = Joined
    joined_count = (
        db.query(func.count(JoiningRecord.id))
        .filter(JoiningRecord.status == JoiningStatus.joined.value)
        .scalar()
        or 0
    )
    totals["Joined"] = joined_count

    # ── Department breakdown ─────────────────────────────────────────────────
    dept_rows = (
        db.query(Candidate.department_applied, func.count(Candidate.id).label("count"))
        .filter(Candidate.department_applied.isnot(None))
        .group_by(Candidate.department_applied)
        .order_by(func.count(Candidate.id).desc())
        .limit(8)
        .all()
    )
    departments: List[Dict[str, Any]] = [
        {"department": dept, "count": cnt} for dept, cnt in dept_rows
    ]

    # ── Recent activity (last 10 candidates by created_at) ───────────────────
    recent_candidates = (
        db.query(Candidate)
        .order_by(Candidate.created_at.desc())
        .limit(10)
        .all()
    )
    recent_activity: List[Dict[str, Any]] = []
    for c in recent_candidates:
        recent_activity.append({
            "candidate_code": c.candidate_code,
            "full_name": c.full_name,
            "department_applied": c.department_applied,
            "status": c.status,
            "created_at": c.created_at.isoformat(),
        })

    total_candidates = sum(v for k, v in totals.items() if k != "Joined")

    return {
        "total_candidates": total_candidates,
        "totals": totals,
        "departments": departments,
        "recent_activity": recent_activity,
        "generated_at": datetime.utcnow().isoformat(),
    }
