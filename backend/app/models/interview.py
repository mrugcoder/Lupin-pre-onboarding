from sqlalchemy import Column, Integer, String, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base


class Interview(Base):
    """Interview record linked to a candidate."""

    __tablename__ = "interviews"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False, index=True)
    interview_date = Column(Date, nullable=True)
    panel = Column(String(300), nullable=True)          # comma-separated panel member names
    department = Column(String(100), nullable=True)
    remarks = Column(Text, nullable=True)

    candidate = relationship("Candidate", back_populates="interviews")
