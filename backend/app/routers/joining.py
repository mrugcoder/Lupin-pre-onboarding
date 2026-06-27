"""
Joining Tracker router — HR only.

Endpoints:
  GET  /joining/               — list candidates with medical_status = Fit
  GET  /joining/{candidate_id} — get joining record (or empty shell)
  POST /joining/{candidate_id} — create/update joining record, generate employee_code, set status = Joined
"""

import logging
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_hr_role
from app.models.candidate import Candidate, CandidateStatus
from app.models.joining import JoiningRecord, JoiningStatus
from app.models.medical import MedicalRecord, MedicalStatus
from app.models.user import User
from app.schemas.joining import JoiningCreate, JoiningListItem, JoiningOut

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/joining", tags=["joining"], redirect_slashes=False)


def _generate_employee_code(db: Session) -> str:
    """Generate LUP-EMP-{YEAR}-{SEQ} using the same transaction-safe pattern as candidate_code."""
    year = datetime.now().year
    count = (
        db.query(func.count(JoiningRecord.id))
        .filter(JoiningRecord.employee_code.like(f"LUP-EMP-{year}-%"))
        .scalar()
        or 0
    )
    return f"LUP-EMP-{year}-{count + 1:03d}"


# ---------------------------------------------------------------------------
# GET /joining/ — HR
# ---------------------------------------------------------------------------

@router.get(
    "",
    response_model=List[JoiningListItem],
    summary="List candidates with medical_status = Fit (HR only)",
)
def list_joining_candidates(
    db: Session = Depends(get_db),
    _: User = Depends(require_hr_role),
) -> List[JoiningListItem]:
    fit_records = (
        db.query(MedicalRecord)
        .filter(MedicalRecord.medical_status == MedicalStatus.fit.value)
        .all()
    )
    fit_candidate_ids = {r.candidate_id for r in fit_records}

    candidates = (
        db.query(Candidate)
        .filter(Candidate.id.in_(fit_candidate_ids))
        .order_by(Candidate.created_at.desc())
        .all()
    )

    items = []
    for c in candidates:
        med = db.query(MedicalRecord).filter(MedicalRecord.candidate_id == c.id).first()
        joining = db.query(JoiningRecord).filter(JoiningRecord.candidate_id == c.id).first()
        items.append(JoiningListItem(
            id=c.id,
            candidate_code=c.candidate_code,
            full_name=c.full_name,
            department_applied=c.department_applied,
            status=c.status,
            medical_status=med.medical_status if med else None,
            joining_date=joining.joining_date if joining else None,
            employee_code=joining.employee_code if joining else None,
            joining_status=joining.status if joining else None,
        ))
    return items


# ---------------------------------------------------------------------------
# GET /joining/{candidate_id} — HR
# ---------------------------------------------------------------------------

@router.get(
    "/{candidate_id}",
    response_model=Optional[JoiningOut],
    summary="Get joining record for a candidate (HR only)",
)
def get_joining(
    candidate_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_hr_role),
) -> Optional[JoiningOut]:
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")

    joining = db.query(JoiningRecord).filter(JoiningRecord.candidate_id == candidate_id).first()
    if not joining:
        return None
    return JoiningOut.model_validate(joining)


# ---------------------------------------------------------------------------
# POST /joining/{candidate_id} — HR
# ---------------------------------------------------------------------------

@router.post(
    "/{candidate_id}",
    response_model=JoiningOut,
    status_code=status.HTTP_201_CREATED,
    summary="Confirm joining — generates employee_code (HR only)",
)
def confirm_joining(
    candidate_id: int,
    body: JoiningCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_hr_role),
) -> JoiningOut:
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")

    # Verify medical Fit
    med = db.query(MedicalRecord).filter(MedicalRecord.candidate_id == candidate_id).first()
    if not med or med.medical_status != MedicalStatus.fit.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Joining can only be confirmed for candidates with medical_status = Fit",
        )

    max_retries = 3
    for attempt in range(max_retries):
        try:
            employee_code = _generate_employee_code(db)

            joining = db.query(JoiningRecord).filter(JoiningRecord.candidate_id == candidate_id).first()
            if joining:
                # Update existing record
                joining.joining_date = body.joining_date
                joining.department = body.department
                joining.designation = body.designation
                joining.reporting_manager = body.reporting_manager
                joining.employee_code = employee_code
                joining.status = JoiningStatus.joined.value
            else:
                joining = JoiningRecord(
                    candidate_id=candidate_id,
                    joining_date=body.joining_date,
                    department=body.department,
                    designation=body.designation,
                    reporting_manager=body.reporting_manager,
                    employee_code=employee_code,
                    status=JoiningStatus.joined.value,
                )
                db.add(joining)

            db.commit()
            db.refresh(joining)

            logger.info(
                "Candidate %s confirmed joining. Employee code: %s",
                candidate.candidate_code,
                employee_code,
            )
            return JoiningOut.model_validate(joining)

        except IntegrityError:
            db.rollback()
            if attempt == max_retries - 1:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Could not generate a unique employee code. Please try again.",
                )
            continue
        except Exception:
            db.rollback()
            raise
