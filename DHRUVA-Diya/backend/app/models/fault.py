from sqlalchemy import Column, BigInteger, Integer, String, Boolean, DateTime, ForeignKey, Index, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.app.database.base import Base

class Fault(Base):
    __tablename__ = "faults"

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    engine_id = Column(String(50), ForeignKey("engines.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    fault_type = Column(String(100), nullable=False)
    severity = Column(String(50), nullable=False, default="MEDIUM")
    description = Column(Text, nullable=True)
    resolved = Column(Boolean, nullable=False, default=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    engine = relationship("Engine", back_populates="faults")

    __table_args__ = (
        Index("idx_faults_engine_timestamp", "engine_id", "timestamp"),
    )
