from sqlalchemy import Column, BigInteger, Integer, String, Float, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.app.database.base import Base

class Telemetry(Base):
    __tablename__ = "telemetry"

    # BigInteger with autoincrement for large time series datasets
    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    engine_id = Column(String(50), ForeignKey("engines.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    rpm = Column(Float, nullable=False)
    temperature = Column(Float, nullable=False)
    oil_pressure = Column(Float, nullable=False)
    fuel_flow = Column(Float, nullable=False)
    altitude = Column(Float, nullable=False)
    throttle = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    engine = relationship("Engine", back_populates="telemetry_records")

    __table_args__ = (
        Index("idx_telemetry_engine_timestamp", "engine_id", "timestamp"),
    )
