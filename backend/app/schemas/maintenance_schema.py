from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

class MaintenanceBase(BaseModel):
    engine_id: str = Field(..., examples=["ENG001"])
    maintenance_type: str = Field(..., examples=["100-Hour Inspection & Oil Change"])
    scheduled_date: datetime = Field(..., examples=["2026-09-15T09:00:00"])
    status: str = Field(default="SCHEDULED", examples=["SCHEDULED"])
    notes: Optional[str] = Field(None, examples=["Check spark plugs, inspect compression, oil filter replacement"])

class MaintenanceCreate(MaintenanceBase):
    pass

class MaintenanceResponse(MaintenanceBase):
    id: int
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
