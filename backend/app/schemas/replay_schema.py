from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from backend.app.schemas.telemetry_schema import TelemetryResponse

class ReplayResponse(BaseModel):
    mission_id: str
    mission_name: str
    engine_id: str
    mission_type: str
    total_data_points: int
    data: List[TelemetryResponse]
