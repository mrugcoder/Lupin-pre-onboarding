"""
Pydantic schemas for the Document checklist resource.
"""

from typing import Optional

from pydantic import BaseModel


DOC_TYPES = [
    "aadhaar",
    "pan",
    "photo",
    "resume",
    "education_cert",
    "experience_letter",
    "salary_proof",
    "bank_details",
]


class DocumentOut(BaseModel):
    id: int
    candidate_id: int
    doc_type: str
    status: str
    file_path: Optional[str]

    model_config = {"from_attributes": True}


class DocumentStatusUpdate(BaseModel):
    status: str  # "Pending" or "Complete"
