"""
Pydantic schemas for the Candidate resource.

Security contract (enforced by AGENTS.md):
- CandidateListItem: safe for HR list views — no PII beyond name.
- CandidateDetail: full record — only returned to authenticated HR users.
- CandidateConfirmation: what the public registration endpoint returns.
"""

from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


# ---------------------------------------------------------------------------
# Inbound — public registration form (multipart, file fields handled separately)
# ---------------------------------------------------------------------------

class CandidateCreate(BaseModel):
    # Personal
    full_name: str = Field(..., min_length=2, max_length=200, description="Full legal name")
    dob: Optional[date] = Field(None, description="Date of birth (YYYY-MM-DD)")
    mobile: str = Field(..., min_length=7, max_length=20, description="Mobile number")
    email: EmailStr = Field(..., description="Contact email address")
    address: Optional[str] = Field(None, max_length=500)

    # Education
    qualification: str = Field(..., min_length=1, max_length=200)
    university: str = Field(..., min_length=1, max_length=200)
    passing_year: int = Field(..., ge=1980, le=2030, description="Year of graduation")
    percentage: Decimal = Field(..., ge=0, le=100)

    # Experience (optional — first-time job seekers may skip)
    company_name: Optional[str] = Field(None, max_length=200)
    years_experience: Optional[Decimal] = Field(None, ge=0, le=50)
    current_ctc: Optional[Decimal] = Field(None, ge=0)
    expected_ctc: Optional[Decimal] = Field(None, ge=0)

    # Position
    department_applied: str = Field(..., min_length=1, max_length=100)


    @field_validator("mobile")
    @classmethod
    def mobile_digits_only(cls, v: str) -> str:
        cleaned = v.strip().replace(" ", "").replace("-", "").replace("+", "")
        if not cleaned.isdigit():
            raise ValueError("Mobile must contain only digits (spaces, dashes, leading + allowed)")
        return v.strip()

    @field_validator("full_name", "address", "company_name", mode="before")
    @classmethod
    def strip_whitespace(cls, v):
        if isinstance(v, str):
            return v.strip()
        return v


# ---------------------------------------------------------------------------
# Outbound — public confirmation (returned immediately after registration)
# ---------------------------------------------------------------------------

class CandidateConfirmation(BaseModel):
    candidate_code: str
    full_name: str
    department_applied: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Outbound — HR list view (NO PII — only safe summary fields)
# ---------------------------------------------------------------------------

class CandidateListItem(BaseModel):
    id: int
    candidate_code: str
    full_name: str
    department_applied: Optional[str]
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Outbound — HR detail view (full PII — authenticated HR only)
# ---------------------------------------------------------------------------

class CandidateDetail(BaseModel):
    id: int
    candidate_code: str

    # Personal
    full_name: str
    dob: Optional[date]
    mobile: Optional[str]
    email: Optional[str]
    address: Optional[str]

    # Education
    qualification: Optional[str]
    university: Optional[str]
    passing_year: Optional[int]
    percentage: Optional[Decimal]

    # Experience
    company_name: Optional[str]
    years_experience: Optional[Decimal]
    current_ctc: Optional[Decimal]
    expected_ctc: Optional[Decimal]

    # Position & status
    department_applied: Optional[str]
    status: str
    created_at: datetime

    # Document summary (doc_type → status)
    documents: list[dict] = []

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Inbound — HR status change (Wave 3)
# ---------------------------------------------------------------------------

class CandidateStatusUpdate(BaseModel):
    status: str  # must match a CandidateStatus enum value
