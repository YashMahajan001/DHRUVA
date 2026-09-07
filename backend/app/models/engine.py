from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.app.database.base import Base

class EngineModel(Base):
    __tablename__ = "engine_models"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    manufacturer = Column(String(100), nullable=False)
    model = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)
    max_rpm = Column(Integer, nullable=False)
    max_temperature = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    engines = relationship("Engine", back_populates="engine_model")


class Engine(Base):
    __tablename__ = "engines"

    id = Column(String(50), primary_key=True, index=True)
    engine_model_id = Column(String(50), ForeignKey("engine_models.id", ondelete="RESTRICT"), nullable=False)
    name = Column(String(100), nullable=False)
    status = Column(String(50), nullable=False, default="ACTIVE")
    total_hours = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    engine_model = relationship("EngineModel", back_populates="engines")
    telemetry_records = relationship("Telemetry", back_populates="engine", cascade="all, delete-orphan")
    twin_states = relationship("TwinState", back_populates="engine", cascade="all, delete-orphan")
    faults = relationship("Fault", back_populates="engine", cascade="all, delete-orphan")
    missions = relationship("Mission", back_populates="engine", cascade="all, delete-orphan")
    tune_profiles = relationship("TuneProfile", back_populates="engine", cascade="all, delete-orphan")
    maintenance_records = relationship("Maintenance", back_populates="engine", cascade="all, delete-orphan")
