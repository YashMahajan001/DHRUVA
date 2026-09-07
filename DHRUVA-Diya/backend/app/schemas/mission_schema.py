from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, ConfigDict, Field

class MissionBase(BaseModel):
    id: str = Field(..., examples=["MSN-004"])
    name: str = Field(..., examples=["Tactical ISR Border Scan"])
    engine_id: str = Field(..., examples=["ENG001"])
    mission_type: str = Field(..., examples=["high_altitude_isr"])
    start_time: datetime = Field(..., examples=["2026-09-06T14:30:00"])
    end_time: Optional[datetime] = None
    status: str = Field(default="PLANNED", examples=["PLANNED"]) # PLANNED, IN_PROGRESS, COMPLETED, ABORTED

class MissionCreate(MissionBase):
    pass

class MissionSimulateRequest(BaseModel):
    mission_type: str = Field(default="high_altitude_isr", examples=["high_altitude_isr"])
    duration_minutes: Optional[int] = Field(default=30, ge=1, le=720)
    time_step_seconds: Optional[float] = Field(default=1.0, ge=0.1, le=60.0)
    inject_fault: Optional[str] = None # e.g. overheating, low_oil_pressure

class MissionResponse(MissionBase):
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
