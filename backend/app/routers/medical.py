"""
Medical Tracker router — HR only.

Endpoints:
  GET   /medical/               — list candidates with status = Selected, with medical_status
  GET   /medical/{candidate_id} — get/create medical record for a candidate
  PATCH /medical/{candidate_id} — update medical_status
"""

import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_hr_role
from app.models.candidate import Candidate, CandidateStatus
from app.models.medical import MedicalRecord, MedicalStatus
from app.models.user import User
from app.schemas.medical import MedicalListItem, MedicalOut, MedicalStatusUpdate

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/medical", tags=["medical"], redirect_slashes=False)


# ---------------------------------------------------------------------------
# GET /medical/ — HR
# ---------------------------------------------------------------------------

@router.get(
    "",
    response_model=List[MedicalListItem],
    summary="List Selected candidates with their medical status (HR only)",
)
def list_medical_candidates(
    db: Session = Depends(get_db),
    _: User = Depends(require_hr_role),
) -> List[MedicalListItem]:
    candidates = (
        db.query(Candidate)
        .filter(Candidate.status == CandidateStatus.selected.value)
        .order_by(Candidate.created_at.desc())
        .all()
    )

    items = []
    for c in candidates:
        record: Optional[MedicalRecord] = (
            db.query(MedicalRecord).filter(MedicalRecord.candidate_id == c.id).first()
        )
        items.append(MedicalListItem(
            id=c.id,
            candidate_code=c.candidate_code,
            full_name=c.full_name,
            department_applied=c.department_applied,
            status=c.status,
            medical_status=record.medical_status if record else None,
        ))
    return items


# ---------------------------------------------------------------------------
# GET /medical/{candidate_id} — HR
# ---------------------------------------------------------------------------

@router.get(
    "/{candidate_id}",
    response_model=MedicalOut,
    summary="Get (or auto-create) medical record for a candidate (HR only)",
)
def get_medical(
    candidate_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_hr_role),
) -> MedicalOut:
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")

    record = db.query(MedicalRecord).filter(MedicalRecord.candidate_id == candidate_id).first()
    if not record:
        # Auto-create "Sent for medical" on first open
        record = MedicalRecord(
            candidate_id=candidate_id,
            medical_status=MedicalStatus.sent_for_medical.value,
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        logger.info(
            "Medical record auto-created for candidate %s (Sent for medical)",
            candidate.candidate_code,
        )

    return MedicalOut.model_validate(record)


# ---------------------------------------------------------------------------
# PATCH /medical/{candidate_id} — HR
# ---------------------------------------------------------------------------

@router.patch(
    "/{candidate_id}",
    response_model=MedicalOut,
    summary="Update medical status for a candidate (HR only)",
)
def update_medical(
    candidate_id: int,
    body: MedicalStatusUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_hr_role),
) -> MedicalOut:
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")

    valid_values = [e.value for e in MedicalStatus]
    if body.medical_status not in valid_values:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid medical_status '{body.medical_status}'. Must be one of: {valid_values}",
        )

    record = db.query(MedicalRecord).filter(MedicalRecord.candidate_id == candidate_id).first()
    if not record:
        record = MedicalRecord(
            candidate_id=candidate_id,
            medical_status=body.medical_status,
        )
        db.add(record)
    else:
        record.medical_status = body.medical_status

    if body.medical_status == MedicalStatus.not_fit.value:
        logger.warning(
            "Candidate %s medical status set to Not Fit. HR should review candidate status separately.",
            candidate.candidate_code,
        )

    db.commit()
    db.refresh(record)

    logger.info(
        "Medical status for candidate %s updated to %s",
        candidate.candidate_code,
        body.medical_status,
    )
    return MedicalOut.model_validate(record)
