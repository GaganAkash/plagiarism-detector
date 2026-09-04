from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, JSON, func
from app.models.user import Base


class Scan(Base):
    __tablename__ = "scans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    scan_number = Column(Integer, nullable=False)  # per-user scan number (1, 2, 3, ...)
    status = Column(String, default="pending")  # pending, processing, completed, failed
    plagiarism_score = Column(Float, nullable=True)
    ai_score = Column(Float, nullable=True)
    plagiarism_details = Column(JSON, nullable=True)
    ai_details = Column(JSON, nullable=True)
    error = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    completed_at = Column(DateTime, nullable=True)
