from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

class FaultBase(BaseModel):
    engine_id: str = Field(..., examples=["ENG001"])
    timestamp: datetime = Field(default_factory=datetime.now)
    fault_type: str = Field(..., examples=["overheating"])
    severity: str = Field(default="MEDIUM", examples=["HIGH"]) # LOW, MEDIUM, HIGH, CRITICAL
    description: Optional[str] = Field(None, examples=["Cylinder head temperature exceeded 240C"])

class FaultCreate(FaultBase):
    pass

class FaultInjectRequest(BaseModel):
    engine_id: str = Field(..., examples=["ENG001"])
    fault_type: str = Field(..., examples=["overheating"]) # overheating, low_oil_pressure, abnormal_rpm, excessive_fuel, sensor_drift
    severity: str = Field(default="HIGH", examples=["HIGH"])
    description: Optional[str] = None
    duration_seconds: Optional[int] = Field(default=60, ge=1, le=3600)
    magnitude: Optional[float] = Field(default=1.0, ge=0.1, le=10.0)

class FaultResponse(FaultBase):
    id: int
    resolved: bool = False
    resolved_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
