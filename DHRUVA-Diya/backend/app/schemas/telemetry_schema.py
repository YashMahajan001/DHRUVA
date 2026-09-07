from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field

class TelemetryMessage(BaseModel):
    """Canonical telemetry message contract shared across backend, simulation, streaming, and UI."""
    engine_id: str = Field(..., examples=["ENG001"])
    timestamp: datetime = Field(..., examples=["2026-09-06T14:20:00"])
    rpm: float = Field(..., ge=0, le=10000, examples=[2450.0])
    temperature: float = Field(..., examples=[87.5])
    oil_pressure: float = Field(..., ge=0, examples=[42.3])
    fuel_flow: float = Field(..., ge=0, examples=[18.4])
    altitude: float = Field(..., ge=-1000, examples=[3500.0])
    throttle: float = Field(..., ge=0, le=100, examples=[72.0])

class TelemetryCreate(TelemetryMessage):
    pass

class TelemetryBatchCreate(BaseModel):
    items: List[TelemetryMessage]

class TelemetryResponse(TelemetryMessage):
    id: int
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class TelemetryFilter(BaseModel):
    engine_id: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    limit: int = Field(default=100, ge=1, le=1000)
