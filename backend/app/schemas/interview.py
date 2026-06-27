"""
Pydantic schemas for the Interview resource.
"""

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field


class InterviewCreate(BaseModel):
    interview_date: date = Field(..., description="Scheduled interview date")
    panel: str = Field(..., min_length=1, max_length=300, description="Comma-separated panel member names")
    department: Optional[str] = Field(None, max_length=100)
    remarks: Optional[str] = Field(None, max_length=2000)


class InterviewOut(BaseModel):
    id: int
    candidate_id: int
    interview_date: Optional[date]
    panel: Optional[str]
    department: Optional[str]
    remarks: Optional[str]

    model_config = {"from_attributes": True}


class InterviewListItem(BaseModel):
    """Safe list item — candidate summary + latest interview date (no full PII)."""
    id: int                          # candidate id
    candidate_code: str
    full_name: str
    department_applied: Optional[str]
    status: str
    interview_date: Optional[date] = None   # latest interview date if scheduled
    panel: Optional[str] = None

    model_config = {"from_attributes": True}
