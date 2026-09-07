from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field

class TuneProfileBase(BaseModel):
    name: str = Field(..., examples=["High-Altitude Lean Cruise Tune"])
    engine_id: str = Field(..., examples=["ENG001"])
    parameters: Dict[str, Any] = Field(
        ..., 
        examples=[{
            "fuel_air_ratio_bias": -0.05,
            "idle_rpm_target": 950,
            "max_throttle_limit": 98.0,
            "turbo_wastegate_bias": 0.1
        }]
    )

class TuneProfileCreate(TuneProfileBase):
    pass

class TuneProfileResponse(TuneProfileBase):
    id: int
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
