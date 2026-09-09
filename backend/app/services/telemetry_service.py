from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from backend.app.models.telemetry import Telemetry
from backend.app.models.engine import Engine
from backend.app.schemas.telemetry_schema import TelemetryMessage
from backend.app.services.health_service import health_service

# Reference to WebSocket manager if available
_websocket_broadcast_fn = None

def register_websocket_broadcaster(fn):
    global _websocket_broadcast_fn
    _websocket_broadcast_fn = fn

class TelemetryService:
    async def process_and_broadcast(self, db: Session, data: TelemetryMessage) -> Dict[str, Any]:
        """Ingests telemetry into DB, evaluates health with Digital Twin, and broadcasts to WebSocket."""
        # Ensure timestamp has timezone awareness
        ts = data.timestamp
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)

        # 1. Create Telemetry DB record
        record = Telemetry(
            engine_id=data.engine_id,
            timestamp=ts,
            rpm=data.rpm,
            temperature=data.temperature,
            oil_pressure=data.oil_pressure,
            fuel_flow=data.fuel_flow,
            altitude=data.altitude,
            throttle=data.throttle
        )
        db.add(record)

        # 2. Update engine total hours incrementally (~1 sec / 3600 hrs per reading)
        engine = db.query(Engine).filter(Engine.id == data.engine_id).first()
        if engine:
            engine.total_hours = round(engine.total_hours + (1.0 / 3600.0), 4)

        db.commit()
        db.refresh(record)

        # 3. Trigger Digital Twin Health Evaluation
        eval_result = health_service.evaluate_telemetry(db, record, engine)

        # 4. Prepare payload for client & WebSocket
        payload = {
            "telemetry": {
                "id": record.id,
                "engine_id": record.engine_id,
                "timestamp": record.timestamp.isoformat(),
                "rpm": record.rpm,
                "temperature": record.temperature,
                "oil_pressure": record.oil_pressure,
                "fuel_flow": record.fuel_flow,
                "altitude": record.altitude,
                "throttle": record.throttle
            },
            "twin_evaluation": eval_result.model_dump(mode="json")
        }

        # 5. Broadcast to connected WebSocket clients if callback registered
        if _websocket_broadcast_fn:
            try:
                await _websocket_broadcast_fn(data.engine_id, payload)
            except Exception:
                pass

        return payload

    def ingest_sync(self, db: Session, data: TelemetryMessage) -> Telemetry:
        """Synchronous ingestion for standard HTTP or batch ingestion."""
        ts = data.timestamp
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)

        record = Telemetry(
            engine_id=data.engine_id,
            timestamp=ts,
            rpm=data.rpm,
            temperature=data.temperature,
            oil_pressure=data.oil_pressure,
            fuel_flow=data.fuel_flow,
            altitude=data.altitude,
            throttle=data.throttle
        )
        db.add(record)

        engine = db.query(Engine).filter(Engine.id == data.engine_id).first()
        if engine:
            engine.total_hours = round(engine.total_hours + (1.0 / 3600.0), 4)

        db.commit()
        db.refresh(record)
        health_service.evaluate_telemetry(db, record, engine)
        return record

    def get_latest(self, db: Session, engine_id: str) -> Optional[Telemetry]:
        record = db.query(Telemetry).filter(
            Telemetry.engine_id == engine_id
        ).order_by(Telemetry.id.desc()).first()
        if record:
            return record
        from backend.app.services.engine_service import engine_service
        resolved = engine_service.get_by_id(db, engine_id)
        if resolved and resolved.id != engine_id:
            return db.query(Telemetry).filter(
                Telemetry.engine_id == resolved.id
            ).order_by(Telemetry.id.desc()).first()
        return None


    def get_history(
        self, db: Session, engine_id: str,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        limit: int = 100
    ) -> List[Telemetry]:
        query = db.query(Telemetry).filter(Telemetry.engine_id == engine_id)
        if start_time:
            query = query.filter(Telemetry.timestamp >= start_time)
        if end_time:
            query = query.filter(Telemetry.timestamp <= end_time)
        return query.order_by(Telemetry.timestamp.desc()).limit(limit).all()

telemetry_service = TelemetryService()
