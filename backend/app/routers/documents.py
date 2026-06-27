"""
Documents router — HR only.

Endpoints:
  GET   /documents/{candidate_id}              — return full 8-item checklist (auto-creates Pending rows)
  PATCH /documents/{candidate_id}/{doc_type}   — toggle status Pending ↔ Complete
"""

import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_hr_role
from app.models.candidate import Candidate
from app.models.document import DocType, Document, DocumentStatus
from app.models.user import User
from app.schemas.document import DocumentOut, DocumentStatusUpdate

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/documents", tags=["documents"], redirect_slashes=False)

ALL_DOC_TYPES = [e.value for e in DocType]


def _ensure_all_docs(candidate_id: int, db: Session) -> None:
    """Create Pending placeholder rows for any missing doc_type so the checklist is always 8 rows."""
    existing = {d.doc_type for d in db.query(Document).filter(Document.candidate_id == candidate_id).all()}
    for dt in ALL_DOC_TYPES:
        if dt not in existing:
            db.add(Document(
                candidate_id=candidate_id,
                doc_type=dt,
                status=DocumentStatus.pending.value,
                file_path=None,
            ))
    db.commit()


# ---------------------------------------------------------------------------
# GET /documents/{candidate_id} — HR
# ---------------------------------------------------------------------------

@router.get(
    "/{candidate_id}",
    response_model=List[DocumentOut],
    summary="Get full document checklist for a candidate (HR only)",
)
def get_documents(
    candidate_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_hr_role),
) -> List[DocumentOut]:
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")

    _ensure_all_docs(candidate_id, db)

    docs = (
        db.query(Document)
        .filter(Document.candidate_id == candidate_id)
        .order_by(Document.id)
        .all()
    )
    return [DocumentOut.model_validate(d) for d in docs]


# ---------------------------------------------------------------------------
# PATCH /documents/{candidate_id}/{doc_type} — HR
# ---------------------------------------------------------------------------

@router.patch(
    "/{candidate_id}/{doc_type}",
    response_model=DocumentOut,
    summary="Toggle document status Pending ↔ Complete (HR only)",
)
def update_document_status(
    candidate_id: int,
    doc_type: str,
    body: DocumentStatusUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_hr_role),
) -> DocumentOut:
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")

    valid_statuses = [e.value for e in DocumentStatus]
    if body.status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid status '{body.status}'. Must be one of: {valid_statuses}",
        )

    _ensure_all_docs(candidate_id, db)

    doc = (
        db.query(Document)
        .filter(Document.candidate_id == candidate_id, Document.doc_type == doc_type)
        .first()
    )
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document type '{doc_type}' not found",
        )

    doc.status = body.status
    db.commit()
    db.refresh(doc)

    logger.info(
        "Document %s for candidate %s marked %s",
        doc_type,
        candidate.candidate_code,
        body.status,
    )
    return DocumentOut.model_validate(doc)


# ---------------------------------------------------------------------------
# GET /documents/ — HR (list all candidates with completion ratio)
# ---------------------------------------------------------------------------

@router.get(
    "",
    response_model=List[dict],
    summary="List all candidates with document completion ratio (HR only)",
)
def list_candidates_documents(
    db: Session = Depends(get_db),
    _: User = Depends(require_hr_role),
) -> List[dict]:
    candidates = db.query(Candidate).order_by(Candidate.created_at.desc()).all()
    result = []
    for c in candidates:
        docs = db.query(Document).filter(Document.candidate_id == c.id).all()
        total = len(ALL_DOC_TYPES)
        complete = sum(1 for d in docs if d.status == DocumentStatus.complete.value)
        result.append({
            "id": c.id,
            "candidate_code": c.candidate_code,
            "full_name": c.full_name,
            "department_applied": c.department_applied,
            "status": c.status,
            "docs_complete": complete,
            "docs_total": total,
        })
    return result
