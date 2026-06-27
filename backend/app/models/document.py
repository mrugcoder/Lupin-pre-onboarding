import enum
from sqlalchemy import Column, Integer, String, Enum as SAEnum, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class DocType(str, enum.Enum):
    aadhaar = "aadhaar"
    pan = "pan"
    photo = "photo"
    resume = "resume"
    education_cert = "education_cert"
    experience_letter = "experience_letter"
    salary_proof = "salary_proof"
    bank_details = "bank_details"


class DocumentStatus(str, enum.Enum):
    pending = "Pending"
    complete = "Complete"


class Document(Base):
    """Document checklist record for a candidate."""

    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False, index=True)
    doc_type = Column(
        SAEnum(DocType, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    status = Column(
        SAEnum(DocumentStatus, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=DocumentStatus.pending.value,
    )
    # file_path is relative to the /uploads directory; never web-root-exposed
    file_path = Column(String(500), nullable=True)

    candidate = relationship("Candidate", back_populates="documents")
