from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field

class TwinStateBase(BaseModel):
    engine_id: str = Field(..., examples=["ENG001"])
    timestamp: datetime = Field(..., examples=["2026-09-06T14:20:00"])
    health_score: float = Field(..., ge=0.0, le=100.0, examples=[82.4])
    health_status: str = Field(..., examples=["GOOD"]) # GOOD, WARNING, CRITICAL
    predicted_state: Optional[Dict[str, Any]] = None

class TwinStateCreate(TwinStateBase):
    pass

class TwinStateResponse(TwinStateBase):
    id: int
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class DigitalTwinEvaluationResult(BaseModel):
    """Agreed contract between Backend, Digital Twin, and ML inference."""
    engine_id: str = Field(..., examples=["ENG001"])
    timestamp: datetime = Field(default_factory=datetime.now)
    health_score: float = Field(..., examples=[82.4])
    health_status: str = Field(..., examples=["GOOD"])
    anomaly: bool = Field(default=False, examples=[False])
    fault: Optional[str] = Field(default=None, examples=[None])
    rul_hours: Optional[float] = Field(default=124.5, examples=[124.5])
    details: Optional[Dict[str, Any]] = None

class SystemHealthResponse(BaseModel):
    status: str = Field(..., examples=["healthy"])
    service: str = Field(..., examples=["SIH26054 Digital Twin UAV Backend"])
    timestamp: datetime = Field(default_factory=datetime.now)
    database: str = Field(..., examples=["connected"])
    active_engines: int = Field(default=0)
    total_telemetry_records: int = Field(default=0)
