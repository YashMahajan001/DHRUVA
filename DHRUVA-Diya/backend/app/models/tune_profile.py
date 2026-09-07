from sqlalchemy import Column, BigInteger, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.app.database.base import Base

class TuneProfile(Base):
    __tablename__ = "tune_profiles"

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    engine_id = Column(String(50), ForeignKey("engines.id", ondelete="CASCADE"), nullable=False, index=True)
    parameters = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    engine = relationship("Engine", back_populates="tune_profiles")
