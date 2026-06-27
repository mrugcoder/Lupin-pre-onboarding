"""
Candidates router.

Public endpoint:
  POST /candidates/register  — no auth, multipart form + file uploads

HR-only endpoints (require valid JWT + hr_admin role):
  GET  /candidates/           — safe list (CandidateListItem, no PII)
  GET  /candidates/{id}       — full detail (CandidateDetail, authenticated HR only)

ID generation: LUP-TAR-{YEAR}-{SEQ} generated inside the DB transaction so two
simultaneous submissions cannot claim the same sequence number.
SQLite note: SQLite serialises writes on a single connection, so the count-based
approach is race-safe for demo/prototype mode. A UNIQUE constraint + IntegrityError
retry provides a second safety net.
"""

import logging
import os
import shutil
import unicodedata
import re
from datetime import datetime
from typing import List

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_hr_role
from app.models.candidate import Candidate, CandidateStatus
from app.models.document import Document, DocType, DocumentStatus
from app.models.user import User
from app.schemas.candidate import (
    CandidateConfirmation,
    CandidateCreate,
    CandidateDetail,
    CandidateListItem,
    CandidateStatusUpdate,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/candidates", tags=["candidates"], redirect_slashes=False)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

ALLOWED_MIME_TYPES = {"application/pdf", "image/jpeg", "image/png"}
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB
UPLOADS_BASE = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _validate_upload(file: UploadFile, field_label: str) -> None:
    """Validate MIME type and file size server-side. Raises HTTP 422 on failure."""
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"{field_label}: only PDF, JPEG, and PNG files are accepted "
                f"(got '{file.content_type}')"
            ),
        )


def _read_and_check_size(file: UploadFile, field_label: str) -> bytes:
    """Read file content and enforce the 5 MB cap."""
    content = file.file.read()
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"{field_label}: file exceeds the 5 MB limit ({len(content)} bytes received)",
        )
    return content


def _safe_filename(filename: str) -> str:
    """Normalise a filename to ASCII, strip dangerous characters."""
    filename = unicodedata.normalize("NFKD", filename).encode("ascii", "ignore").decode()
    filename = re.sub(r"[^\w.\-]", "_", filename)
    return filename[:120]  # cap length


def _save_file(content: bytes, dest_dir: str, filename: str) -> str:
    """Write bytes to dest_dir/filename; return the relative path."""
    os.makedirs(dest_dir, exist_ok=True)
    safe_name = _safe_filename(filename or "upload")
    dest_path = os.path.join(dest_dir, safe_name)
    with open(dest_path, "wb") as f:
        f.write(content)
    return dest_path


def _generate_candidate_code(db: Session) -> str:
    """
    Generate the next LUP-TAR-{YEAR}-{SEQ} code.
    Count existing codes for the current year and increment.
    The UNIQUE constraint on candidate_code catches any edge-case race.
    """
    year = datetime.now().year
    count = (
        db.query(func.count(Candidate.id))
        .filter(Candidate.candidate_code.like(f"LUP-TAR-{year}-%"))
        .scalar()
        or 0
    )
    return f"LUP-TAR-{year}-{count + 1:03d}"


# ---------------------------------------------------------------------------
# POST /candidates/register — PUBLIC (no auth)
# ---------------------------------------------------------------------------

@router.post(
    "/register",
    response_model=CandidateConfirmation,
    status_code=status.HTTP_201_CREATED,
    summary="Public candidate registration",
    description=(
        "Submit a candidate application. No login required. "
        "Returns the auto-generated Application ID on success."
    ),
)
def register_candidate(
    # ── Personal ────────────────────────────────────────────────────────────
    full_name: str = Form(...),
    dob: str = Form(None),
    mobile: str = Form(...),
    email: str = Form(...),
    address: str = Form(None),
    # ── Education ───────────────────────────────────────────────────────────
    qualification: str = Form(...),
    university: str = Form(...),
    passing_year: int = Form(...),
    percentage: float = Form(...),
    # ── Experience (optional) ───────────────────────────────────────────────
    company_name: str = Form(None),
    years_experience: float = Form(None),
    current_ctc: float = Form(None),
    expected_ctc: float = Form(None),
    # ── Position ─────────────────────────────────────────────────────────────
    department_applied: str = Form(...),
    # ── Files ────────────────────────────────────────────────────────────────
    resume: UploadFile = File(...),
    education_cert: UploadFile = File(None),
    db: Session = Depends(get_db),
) -> CandidateConfirmation:
    # 1. Validate + read files (server-side MIME and size checks)
    _validate_upload(resume, "Resume")
    resume_content = _read_and_check_size(resume, "Resume")

    cert_content = None
    if education_cert and education_cert.filename:
        _validate_upload(education_cert, "Education certificate")
        cert_content = _read_and_check_size(education_cert, "Education certificate")

    # 2. Validate text fields via Pydantic
    from decimal import Decimal
    from datetime import date as date_type

    dob_parsed = None
    if dob:
        try:
            dob_parsed = date_type.fromisoformat(dob)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="dob must be in YYYY-MM-DD format",
            )

    payload = CandidateCreate(
        full_name=full_name,
        dob=dob_parsed,
        mobile=mobile,
        email=email,
        address=address,
        qualification=qualification,
        university=university,
        passing_year=passing_year,
        percentage=Decimal(str(percentage)),
        company_name=company_name,
        years_experience=Decimal(str(years_experience)) if years_experience is not None else None,
        current_ctc=Decimal(str(current_ctc)) if current_ctc is not None else None,
        expected_ctc=Decimal(str(expected_ctc)) if expected_ctc is not None else None,
        department_applied=department_applied,
    )

    # 3. Persist inside a transaction with retry for the UNIQUE constraint
    max_retries = 3
    for attempt in range(max_retries):
        try:
            candidate_code = _generate_candidate_code(db)

            candidate = Candidate(
                candidate_code=candidate_code,
                full_name=payload.full_name,
                dob=payload.dob,
                mobile=payload.mobile,
                email=str(payload.email),
                address=payload.address,
                qualification=payload.qualification,
                university=payload.university,
                passing_year=payload.passing_year,
                percentage=payload.percentage,
                company_name=payload.company_name,
                years_experience=payload.years_experience,
                current_ctc=payload.current_ctc,
                expected_ctc=payload.expected_ctc,
                department_applied=payload.department_applied,
                status=CandidateStatus.new_application.value,
            )
            db.add(candidate)
            db.flush()  # get candidate.id without committing

            # 4. Save files to disk (after we have the ID)
            year = datetime.now().year
            dest_dir = os.path.abspath(
                os.path.join(UPLOADS_BASE, str(year), candidate_code)
            )
            resume_path = _save_file(resume_content, dest_dir, resume.filename or "resume")

            resume_doc = Document(
                candidate_id=candidate.id,
                doc_type=DocType.resume.value,
                status=DocumentStatus.complete.value,
                file_path=resume_path,
            )
            db.add(resume_doc)

            if cert_content:
                cert_path = _save_file(
                    cert_content, dest_dir, education_cert.filename or "education_cert"
                )
                cert_doc = Document(
                    candidate_id=candidate.id,
                    doc_type=DocType.education_cert.value,
                    status=DocumentStatus.complete.value,
                    file_path=cert_path,
                )
                db.add(cert_doc)

            db.commit()
            db.refresh(candidate)

            logger.info(
                "New candidate registered: %s (%s) for %s",
                candidate.full_name,
                candidate.candidate_code,
                candidate.department_applied,
            )

            return CandidateConfirmation.model_validate(candidate)

        except IntegrityError:
            db.rollback()
            if attempt == max_retries - 1:
                logger.error(
                    "Failed to generate unique candidate_code after %d attempts", max_retries
                )
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Could not generate a unique Application ID. Please try again.",
                )
            # retry with a fresh count on the next loop iteration
            continue
        except Exception:
            db.rollback()
            raise


# ---------------------------------------------------------------------------
# GET /candidates/ — HR only (safe list, no PII)
# ---------------------------------------------------------------------------

@router.get(
    "",
    response_model=List[CandidateListItem],
    summary="List all candidates (HR only)",
    description=(
        "Returns a safe summary list — name, Application ID, department, status, and date only. "
        "Full PII is never included. Requires valid HR JWT."
    ),
)
def list_candidates(
    db: Session = Depends(get_db),
    _: User = Depends(require_hr_role),
) -> List[CandidateListItem]:
    candidates = (
        db.query(Candidate).order_by(Candidate.created_at.desc()).all()
    )
    return [CandidateListItem.model_validate(c) for c in candidates]


# ---------------------------------------------------------------------------
# GET /candidates/{candidate_id} — HR only (full PII)
# ---------------------------------------------------------------------------

@router.get(
    "/{candidate_id}",
    response_model=CandidateDetail,
    summary="Get candidate detail (HR only)",
    description=(
        "Returns the full candidate record including PII. "
        "Requires valid HR JWT. Never called from list views."
    ),
)
def get_candidate(
    candidate_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_hr_role),
) -> CandidateDetail:
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate {candidate_id} not found",
        )

    # Build the documents summary inline — serialise to plain dicts so
    # Pydantic's list[dict] field doesn't receive ORM model instances.
    docs = [
        {
            "doc_type": d.doc_type,
            "status": d.status,
            "file_path": d.file_path,
        }
        for d in candidate.documents
    ]

    # Temporarily detach documents from the ORM relationship so model_validate
    # doesn't try to coerce them — we supply the serialised list ourselves.
    detail = CandidateDetail(
        id=candidate.id,
        candidate_code=candidate.candidate_code,
        full_name=candidate.full_name,
        dob=candidate.dob,
        mobile=candidate.mobile,
        email=candidate.email,
        address=candidate.address,
        qualification=candidate.qualification,
        university=candidate.university,
        passing_year=candidate.passing_year,
        percentage=candidate.percentage,
        company_name=candidate.company_name,
        years_experience=candidate.years_experience,
        current_ctc=candidate.current_ctc,
        expected_ctc=candidate.expected_ctc,
        department_applied=candidate.department_applied,
        status=candidate.status,
        created_at=candidate.created_at,
        documents=docs,
    )
    return detail


# ---------------------------------------------------------------------------
# PATCH /candidates/{candidate_id}/status — HR only
# ---------------------------------------------------------------------------

@router.patch(
    "/{candidate_id}/status",
    response_model=CandidateListItem,
    summary="Update candidate status (HR only)",
    description="Transition a candidate through the pipeline. Requires valid HR JWT.",
)
def update_candidate_status(
    candidate_id: int,
    body: CandidateStatusUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_hr_role),
) -> CandidateListItem:
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate {candidate_id} not found",
        )

    # Validate against the enum
    valid_values = [e.value for e in CandidateStatus]
    if body.status not in valid_values:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid status '{body.status}'. Must be one of: {valid_values}",
        )

    old_status = candidate.status
    candidate.status = body.status
    db.commit()
    db.refresh(candidate)

    logger.info(
        "Candidate %s status changed: %s → %s",
        candidate.candidate_code,
        old_status,
        body.status,
    )

    return CandidateListItem.model_validate(candidate)
