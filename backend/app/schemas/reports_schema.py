from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

class ReportResponse(BaseModel):
    report_id: str
    generated_at: datetime = Field(default_factory=datetime.now)
    engine_id: str
    engine_name: str
    health_score: float
    health_status: str
    total_operating_hours: float
    active_faults_count: int
    faults_summary: List[Dict[str, Any]]
    telemetry_summary: Dict[str, Any]
    recommendations: List[str]
