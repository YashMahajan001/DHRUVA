from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field

class EngineModelBase(BaseModel):
    id: str = Field(..., examples=["MDL-O320"])
    name: str = Field(..., examples=["Lycoming O-320-D2J"])
    manufacturer: str = Field(..., examples=["Lycoming"])
    model: str = Field(..., examples=["O-320"])
    type: str = Field(..., examples=["4-Cylinder Horizontally Opposed"])
    max_rpm: int = Field(..., examples=[2700])
    max_temperature: float = Field(..., examples=[260.0])

class EngineModelResponse(EngineModelBase):
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class EngineBase(BaseModel):
    id: str = Field(..., examples=["ENG001"])
    engine_model_id: str = Field(..., examples=["MDL-O320"])
    name: str = Field(..., examples=["Eagle-1 Primary Engine"])
    status: str = Field(default="ACTIVE", examples=["ACTIVE"])
    total_hours: float = Field(default=0.0, examples=[142.5])

class EngineCreate(EngineBase):
    pass

class EngineUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    total_hours: Optional[float] = None

class EngineResponse(EngineBase):
    created_at: Optional[datetime] = None
    engine_model: Optional[EngineModelResponse] = None

    model_config = ConfigDict(from_attributes=True)
