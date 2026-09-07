from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.app.database.base import Base

class Mission(Base):
    __tablename__ = "missions"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    engine_id = Column(String(50), ForeignKey("engines.id", ondelete="CASCADE"), nullable=False, index=True)
    mission_type = Column(String(100), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(50), nullable=False, default="PLANNED")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    engine = relationship("Engine", back_populates="missions")
