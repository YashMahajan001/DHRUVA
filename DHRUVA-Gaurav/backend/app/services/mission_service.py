from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from backend.app.models.mission import Mission
from backend.app.models.engine import Engine
from backend.app.schemas.mission_schema import MissionCreate, MissionSimulateRequest
from backend.app.schemas.telemetry_schema import TelemetryMessage
from backend.app.services.telemetry_service import telemetry_service

class MissionService:
    def get_all(
        self, db: Session, engine_id: Optional[str] = None, status: Optional[str] = None
    ) -> List[Mission]:
        query = db.query(Mission)
        if engine_id:
            query = query.filter(Mission.engine_id == engine_id)
        if status:
            query = query.filter(Mission.status == status)
        return query.order_by(Mission.start_time.desc()).all()

    def get_by_id(self, db: Session, mission_id: str) -> Optional[Mission]:
        return db.query(Mission).filter(Mission.id == mission_id).first()

    def create(self, db: Session, mission_in: MissionCreate) -> Mission:
        mission = Mission(
            id=mission_in.id,
            name=mission_in.name,
            engine_id=mission_in.engine_id,
            mission_type=mission_in.mission_type,
            start_time=mission_in.start_time,
            end_time=mission_in.end_time,
            status=mission_in.status
        )
        db.add(mission)
        db.commit()
        db.refresh(mission)
        return mission

    def simulate_mission(
        self, db: Session, mission_id: str, req: MissionSimulateRequest
    ) -> Dict[str, Any]:
        """Generates synthetic mission telemetry across flight phases."""
        mission = self.get_by_id(db, mission_id)
        if not mission:
            return {"error": "Mission not found"}

        # Define phases for simulation
        phases = [
            {"phase": "Preflight / Idle", "fraction": 0.1, "throttle": 20.0, "rpm": 1000.0, "alt": 50.0, "temp": 75.0, "oil": 45.0, "fuel": 6.0},
            {"phase": "Takeoff / Climb", "fraction": 0.2, "throttle": 95.0, "rpm": 2650.0, "alt": 3000.0, "temp": 110.0, "oil": 55.0, "fuel": 28.0},
            {"phase": "Cruise / Loiter", "fraction": 0.4, "throttle": 70.0, "rpm": 2350.0, "alt": 5000.0, "temp": 92.0, "oil": 48.0, "fuel": 18.0},
            {"phase": "Descent", "fraction": 0.2, "throttle": 40.0, "rpm": 1800.0, "alt": 1500.0, "temp": 82.0, "oil": 42.0, "fuel": 11.0},
            {"phase": "Landing / Taxi", "fraction": 0.1, "throttle": 15.0, "rpm": 950.0, "alt": 50.0, "temp": 78.0, "oil": 40.0, "fuel": 5.5},
        ]

        total_steps = 20 # representative checkpoints
        now = datetime.now(timezone.utc)
        generated_points = 0

        for i in range(total_steps):
            progress = i / total_steps
            # Determine current phase
            acc = 0.0
            cur_p = phases[0]
            for p in phases:
                acc += p["fraction"]
                if progress <= acc:
                    cur_p = p
                    break

            # Handle fault injection if requested
            temp = cur_p["temp"]
            oil = cur_p["oil"]
            rpm = cur_p["rpm"]
            if req.inject_fault == "overheating" and i >= (total_steps // 2):
                temp += 60.0 # Exceed limits
            elif req.inject_fault == "low_oil_pressure" and i >= (total_steps // 2):
                oil -= 30.0 # Drop below safe limit

            msg = TelemetryMessage(
                engine_id=mission.engine_id,
                timestamp=now - timedelta(seconds=(total_steps - i) * 10),
                rpm=rpm,
                temperature=temp,
                oil_pressure=oil,
                fuel_flow=cur_p["fuel"],
                altitude=cur_p["alt"],
                throttle=cur_p["throttle"]
            )
            telemetry_service.ingest_sync(db, msg)
            generated_points += 1

        mission.status = "COMPLETED"
        mission.end_time = now

        db.commit()

        return {
            "mission_id": mission.id,
            "status": mission.status,
            "simulated_points": generated_points,
            "injected_fault": req.inject_fault,
            "message": f"Successfully simulated mission '{mission.name}' with {generated_points} telemetry records."
        }

mission_service = MissionService()
