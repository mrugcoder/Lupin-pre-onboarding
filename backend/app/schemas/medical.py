"""
Pydantic schemas for the Medical Tracker resource.
"""

from typing import Optional

from pydantic import BaseModel


class MedicalOut(BaseModel):
    id: int
    candidate_id: int
    medical_status: str

    model_config = {"from_attributes": True}


class MedicalStatusUpdate(BaseModel):
    medical_status: str  # one of the MedicalStatus enum values


class MedicalListItem(BaseModel):
    """Candidate summary + medical status for the Medical list view."""
    id: int                       # candidate id
    candidate_code: str
    full_name: str
    department_applied: Optional[str]
    status: str                   # candidate status
    medical_status: Optional[str] = None

    model_config = {"from_attributes": True}
