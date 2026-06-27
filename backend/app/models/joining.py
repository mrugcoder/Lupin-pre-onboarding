import enum
from sqlalchemy import Column, Integer, String, Date, Enum as SAEnum, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class JoiningStatus(str, enum.Enum):
    pending = "Pending"
    joined = "Joined"


class JoiningRecord(Base):
    """Joining tracker for a candidate post-selection."""

    __tablename__ = "joining_records"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False, index=True)
    joining_date = Column(Date, nullable=True)
    department = Column(String(100), nullable=True)
    designation = Column(String(100), nullable=True)
    reporting_manager = Column(String(200), nullable=True)
    # employee_code is generated only after status transitions to "Joined" (Task 4)
    employee_code = Column(String(50), nullable=True)
    status = Column(
        SAEnum(JoiningStatus, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=JoiningStatus.pending.value,
    )

    candidate = relationship("Candidate", back_populates="joining_records")
