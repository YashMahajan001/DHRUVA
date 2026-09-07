from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict, Field
from backend.app.database.session import get_db
from backend.app.models.engine import Engine
from backend.app.models.telemetry import Telemetry
from backend.app.models.twin_state import TwinState
from backend.app.models.fault import Fault
from backend.app.services.engine_service import engine_service
from backend.app.services.telemetry_service import telemetry_service
from backend.app.services.health_service import health_service

router = APIRouter(tags=["Fleet Monitoring"])


# ── Response Schemas ────────────────────────────────────────────────────────────

class FleetEngineSnapshot(BaseModel):
    """Summary of a single engine within the fleet view."""
    engine_id: str
    name: str
    status: str
    total_hours: float
    health_score: Optional[float] = None
    health_status: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class FleetAggregate(BaseModel):
    """Fleet-wide aggregate statistics."""
    total_engines: int
    active_count: int
    fault_count: int
    idle_count: int
    average_health_score: float
    system_status: str  # NORMAL, WARNING, CRITICAL


class FleetResponse(BaseModel):
    """Full fleet monitoring response."""
    aggregate: FleetAggregate
    engines: List[FleetEngineSnapshot]
    timestamp: datetime


class FleetTelemetryResponse(BaseModel):
    """Live telemetry snapshot for a specific engine."""
    engine_id: str
    timestamp: datetime
    rpm: float
    temperature: float
    oil_pressure: float
    fuel_flow: float
    altitude: float
    throttle: float

    model_config = ConfigDict(from_attributes=True)


class FleetTwinResponse(BaseModel):
    """Digital twin state for a specific engine."""
    engine_id: str
    timestamp: datetime
    health_score: float
    health_status: str
    anomaly: bool
    fault: Optional[str] = None
    rul_hours: Optional[float] = None
    predicted_state: Optional[Dict[str, Any]] = None


class FleetAlertResponse(BaseModel):
    """Fleet-wide alert summary."""
    id: int
    engine_id: str
    timestamp: datetime
    alert_type: str
    severity: str
    description: Optional[str] = None
    resolved: bool

    model_config = ConfigDict(from_attributes=True)


# ── Routes ──────────────────────────────────────────────────────────────────────

@router.get("/fleet", response_model=FleetResponse)
def get_fleet(db: Session = Depends(get_db)):
    """
    Get fleet aggregate statistics and all engine instance summaries.
    Provides a single-call overview for the fleet monitoring dashboard.
    """
    engines = db.query(Engine).all()
    total = len(engines)
    active = sum(1 for e in engines if e.status == "ACTIVE")
    faulted = sum(1 for e in engines if e.status == "FAULT")
    idle = sum(1 for e in engines if e.status == "IDLE")

    # Gather latest health scores
    snapshots = []
    health_scores = []
    for eng in engines:
        latest_twin = health_service.get_latest_health(db, eng.id)
        h_score = latest_twin.health_score if latest_twin else 100.0
        h_status = latest_twin.health_status if latest_twin else "GOOD"
        health_scores.append(h_score)
        snapshots.append(FleetEngineSnapshot(
            engine_id=eng.id,
            name=eng.name,
            status=eng.status,
            total_hours=eng.total_hours,
            health_score=round(h_score, 1),
            health_status=h_status,
        ))

    avg_health = round(sum(health_scores) / len(health_scores), 1) if health_scores else 100.0

    if faulted > 0:
        sys_status = "CRITICAL" if avg_health < 50 else "WARNING"
    else:
        sys_status = "NORMAL"

    return FleetResponse(
        aggregate=FleetAggregate(
            total_engines=total,
            active_count=active,
            fault_count=faulted,
            idle_count=idle,
            average_health_score=avg_health,
            system_status=sys_status,
        ),
        engines=snapshots,
        timestamp=datetime.now(timezone.utc),
    )


@router.get("/telemetry/{engine_id}", response_model=FleetTelemetryResponse)
def get_fleet_telemetry(engine_id: str, db: Session = Depends(get_db)):
    """
    Get the latest live telemetry snapshot for a specific engine.
    Used by the fleet monitoring dashboard for real-time status cards.
    """
    record = telemetry_service.get_latest(db, engine_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No telemetry data found for engine '{engine_id}'.",
        )
    return FleetTelemetryResponse(
        engine_id=record.engine_id,
        timestamp=record.timestamp,
        rpm=record.rpm,
        temperature=record.temperature,
        oil_pressure=record.oil_pressure,
        fuel_flow=record.fuel_flow,
        altitude=record.altitude,
        throttle=record.throttle,
    )


@router.get("/twin/{engine_id}", response_model=FleetTwinResponse)
def get_fleet_twin(engine_id: str, db: Session = Depends(get_db)):
    """
    Get the digital twin state for a specific engine.
    Returns health score, status, anomaly detection, and RUL prediction.
    """
    engine = engine_service.get_by_id(db, engine_id)
    if not engine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Engine '{engine_id}' not found.",
        )

    twin_state = health_service.get_latest_health(db, engine_id)
    if not twin_state:
        # Default state when no telemetry has been processed
        return FleetTwinResponse(
            engine_id=engine_id,
            timestamp=datetime.now(timezone.utc),
            health_score=100.0,
            health_status="GOOD",
            anomaly=False,
            fault=None,
            rul_hours=round(2000.0 - engine.total_hours, 1),
            predicted_state=None,
        )

    return FleetTwinResponse(
        engine_id=engine_id,
        timestamp=twin_state.timestamp,
        health_score=round(twin_state.health_score, 1),
        health_status=twin_state.health_status,
        anomaly=twin_state.health_status != "GOOD",
        fault=(
            twin_state.predicted_state.get("detected_fault")
            if twin_state.predicted_state
            else None
        ),
        rul_hours=(
            twin_state.predicted_state.get("rul_hours")
            if twin_state.predicted_state
            else round(2000.0 - engine.total_hours, 1)
        ),
        predicted_state=twin_state.predicted_state,
    )


@router.get("/alerts", response_model=List[FleetAlertResponse])
def get_fleet_alerts(db: Session = Depends(get_db)):
    """
    Get fleet-wide active alerts (unresolved faults across all engines).
    """
    faults = (
        db.query(Fault)
        .filter(Fault.resolved == False)
        .order_by(Fault.timestamp.desc(), Fault.id.desc())
        .limit(200)
        .all()
    )
    return [
        FleetAlertResponse(
            id=f.id,
            engine_id=f.engine_id,
            timestamp=f.timestamp,
            alert_type=f.fault_type,
            severity=f.severity,
            description=f.description,
            resolved=f.resolved,
        )
        for f in faults
    ]
