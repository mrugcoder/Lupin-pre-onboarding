import enum
from sqlalchemy import Column, Integer, String, Date, Numeric, Enum as SAEnum, DateTime, func
from sqlalchemy.orm import relationship
from app.database import Base


class CandidateStatus(str, enum.Enum):
    new_application = "New Application"
    shortlisted = "Shortlisted"
    interview_scheduled = "Interview Scheduled"
    selected = "Selected"
    rejected = "Rejected"
    hold = "Hold"


class Candidate(Base):
    """
    Core candidate record.
    candidate_code follows the LUP-TAR-{YEAR}-{SEQ} format but is nullable here;
    the generation logic (Task 3) will populate it and add a NOT NULL constraint.
    """

    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)

    # Auto-generated on registration: LUP-TAR-{YEAR}-{SEQ}
    candidate_code = Column(String(20), unique=True, nullable=False, index=True)

    # Personal details
    full_name = Column(String(200), nullable=False)
    dob = Column(Date, nullable=True)
    mobile = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True, index=True)
    address = Column(String(500), nullable=True)

    # Education
    qualification = Column(String(200), nullable=True)
    university = Column(String(200), nullable=True)
    passing_year = Column(Integer, nullable=True)
    percentage = Column(Numeric(5, 2), nullable=True)

    # Experience
    company_name = Column(String(200), nullable=True)
    years_experience = Column(Numeric(4, 1), nullable=True)
    current_ctc = Column(Numeric(12, 2), nullable=True)
    expected_ctc = Column(Numeric(12, 2), nullable=True)

    # Position
    department_applied = Column(String(100), nullable=True)

    # Workflow status
    status = Column(
        SAEnum(CandidateStatus, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=CandidateStatus.new_application.value,
    )

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    interviews = relationship("Interview", back_populates="candidate", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="candidate", cascade="all, delete-orphan")
    medical_records = relationship("MedicalRecord", back_populates="candidate", cascade="all, delete-orphan")
    joining_records = relationship("JoiningRecord", back_populates="candidate", cascade="all, delete-orphan")
