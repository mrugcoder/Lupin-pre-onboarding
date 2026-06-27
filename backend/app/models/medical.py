import enum
from sqlalchemy import Column, Integer, Enum as SAEnum, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class MedicalStatus(str, enum.Enum):
    sent_for_medical = "Sent for medical"
    report_received = "Report received"
    fit = "Fit"
    not_fit = "Not Fit"


class MedicalRecord(Base):
    """Medical tracking record for a candidate."""

    __tablename__ = "medical_records"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False, index=True)
    medical_status = Column(
        SAEnum(MedicalStatus, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=MedicalStatus.sent_for_medical.value,
    )

    candidate = relationship("Candidate", back_populates="medical_records")
