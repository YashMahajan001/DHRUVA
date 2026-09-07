from sqlalchemy import Column, BigInteger, Integer, String, Float, DateTime, ForeignKey, Index, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.app.database.base import Base

class TwinState(Base):
    __tablename__ = "twin_states"

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    engine_id = Column(String(50), ForeignKey("engines.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    health_score = Column(Float, nullable=False)
    health_status = Column(String(50), nullable=False, default="GOOD")
    predicted_state = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    engine = relationship("Engine", back_populates="twin_states")

    __table_args__ = (
        Index("idx_twin_states_engine_timestamp", "engine_id", "timestamp"),
    )
