"""
Interviews router — HR only.

Endpoints:
  GET  /interviews/              — list candidates eligible for interview (Shortlisted or later)
  GET  /interviews/{candidate_id}  — full interview record for one candidate
  POST /interviews/{candidate_id}  — create/update interview; transitions status → Interview Scheduled
"""

import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_hr_role
from app.models.candidate import Candidate, CandidateStatus
from app.models.interview import Interview
from app.models.user import User
from app.schemas.interview import InterviewCreate, InterviewListItem, InterviewOut

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/interviews", tags=["interviews"], redirect_slashes=False)

# Statuses eligible to appear in the interview pipeline view
_ELIGIBLE_STATUSES = {
    CandidateStatus.shortlisted.value,
    CandidateStatus.interview_scheduled.value,
    CandidateStatus.selected.value,
    CandidateStatus.rejected.value,
    CandidateStatus.hold.value,
}


# ---------------------------------------------------------------------------
# GET /interviews/ — HR
# ---------------------------------------------------------------------------

@router.get(
    "",
    response_model=List[InterviewListItem],
    summary="List candidates in the interview pipeline (HR only)",
)
def list_interview_candidates(
    db: Session = Depends(get_db),
    _: User = Depends(require_hr_role),
) -> List[InterviewListItem]:
    candidates = (
        db.query(Candidate)
        .filter(Candidate.status.in_(list(_ELIGIBLE_STATUSES)))
        .order_by(Candidate.created_at.desc())
        .all()
    )

    items = []
    for c in candidates:
        latest_interview: Optional[Interview] = (
            db.query(Interview)
            .filter(Interview.candidate_id == c.id)
            .order_by(Interview.id.desc())
            .first()
        )
        item = InterviewListItem(
            id=c.id,
            candidate_code=c.candidate_code,
            full_name=c.full_name,
            department_applied=c.department_applied,
            status=c.status,
            interview_date=latest_interview.interview_date if latest_interview else None,
            panel=latest_interview.panel if latest_interview else None,
        )
        items.append(item)
    return items


# ---------------------------------------------------------------------------
# GET /interviews/{candidate_id} — HR
# ---------------------------------------------------------------------------

@router.get(
    "/{candidate_id}",
    response_model=InterviewOut,
    summary="Get interview record for a candidate (HR only)",
)
def get_interview(
    candidate_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_hr_role),
) -> InterviewOut:
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")

    interview = (
        db.query(Interview)
        .filter(Interview.candidate_id == candidate_id)
        .order_by(Interview.id.desc())
        .first()
    )
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No interview record for this candidate yet",
        )
    return InterviewOut.model_validate(interview)


# ---------------------------------------------------------------------------
# POST /interviews/{candidate_id} — HR (upsert: create or update latest record)
# ---------------------------------------------------------------------------

@router.post(
    "/{candidate_id}",
    response_model=InterviewOut,
    status_code=status.HTTP_201_CREATED,
    summary="Schedule / update an interview and advance candidate status (HR only)",
)
def schedule_interview(
    candidate_id: int,
    body: InterviewCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_hr_role),
) -> InterviewOut:
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")

    # Upsert: update the latest record if it exists, else create a new one
    interview = (
        db.query(Interview)
        .filter(Interview.candidate_id == candidate_id)
        .order_by(Interview.id.desc())
        .first()
    )
    if interview:
        interview.interview_date = body.interview_date
        interview.panel = body.panel
        interview.department = body.department
        interview.remarks = body.remarks
    else:
        interview = Interview(
            candidate_id=candidate_id,
            interview_date=body.interview_date,
            panel=body.panel,
            department=body.department,
            remarks=body.remarks,
        )
        db.add(interview)

    # Advance candidate status to Interview Scheduled (if not already further along)
    _advance_to_interview_scheduled = {
        CandidateStatus.shortlisted.value,
        CandidateStatus.new_application.value,
    }
    if candidate.status in _advance_to_interview_scheduled:
        candidate.status = CandidateStatus.interview_scheduled.value
        logger.info(
            "Candidate %s status → Interview Scheduled (interview scheduled)",
            candidate.candidate_code,
        )

    db.commit()
    db.refresh(interview)
    return InterviewOut.model_validate(interview)
