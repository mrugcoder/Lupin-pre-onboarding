"""
Pydantic schemas for the Joining Tracker resource.
"""

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field


class JoiningCreate(BaseModel):
    joining_date: date = Field(..., description="Official joining date")
    department: str = Field(..., min_length=1, max_length=100)
    designation: str = Field(..., min_length=1, max_length=100)
    reporting_manager: str = Field(..., min_length=1, max_length=200)


class JoiningOut(BaseModel):
    id: int
    candidate_id: int
    joining_date: Optional[date]
    department: Optional[str]
    designation: Optional[str]
    reporting_manager: Optional[str]
    employee_code: Optional[str]
    status: str

    model_config = {"from_attributes": True}


class JoiningListItem(BaseModel):
    """Candidate summary + joining info for the Joining list view."""
    id: int                       # candidate id
    candidate_code: str
    full_name: str
    department_applied: Optional[str]
    status: str                   # candidate status (Selected)
    medical_status: Optional[str] = None
    joining_date: Optional[date] = None
    employee_code: Optional[str] = None
    joining_status: Optional[str] = None  # joining_records.status

    model_config = {"from_attributes": True}
