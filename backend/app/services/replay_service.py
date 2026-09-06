from typing import Optional, List
from sqlalchemy.orm import Session
from backend.app.models.mission import Mission
from backend.app.models.telemetry import Telemetry
from backend.app.schemas.replay_schema import ReplayResponse
from backend.app.schemas.telemetry_schema import TelemetryResponse

class ReplayService:
    def get_mission_replay(self, db: Session, mission_id: str) -> Optional[ReplayResponse]:
        mission = db.query(Mission).filter(Mission.id == mission_id).first()
        if not mission:
            return None

        query = db.query(Telemetry).filter(Telemetry.engine_id == mission.engine_id)
        if mission.start_time:
            query = query.filter(Telemetry.timestamp >= mission.start_time)
        if mission.end_time:
            query = query.filter(Telemetry.timestamp <= mission.end_time)

        records = query.order_by(Telemetry.timestamp.asc()).limit(500).all()

        # Fallback if specific window has no data: return most recent points for that engine
        if not records:
            records = db.query(Telemetry).filter(
                Telemetry.engine_id == mission.engine_id
            ).order_by(Telemetry.timestamp.asc()).limit(100).all()

        pydantic_records = [TelemetryResponse.model_validate(r) for r in records]

        return ReplayResponse(
            mission_id=mission.id,
            mission_name=mission.name,
            engine_id=mission.engine_id,
            mission_type=mission.mission_type,
            total_data_points=len(pydantic_records),
            data=pydantic_records
        )

replay_service = ReplayService()
