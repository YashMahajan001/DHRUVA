from datetime import datetime, timezone
from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.app.database.session import get_db
from backend.app.models.engine import Engine
from backend.app.models.telemetry import Telemetry
from backend.app.schemas.health_schema import SystemHealthResponse

router = APIRouter(tags=["Health"])

@router.get("/health", response_model=SystemHealthResponse)
def get_system_health(db: Session = Depends(get_db)):
    """Milestone 1 Health check endpoint verifying backend and database status."""
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unreachable: {e}"

    active_engines = db.query(Engine).filter(Engine.status == "ACTIVE").count()
    total_telemetry = db.query(Telemetry).count()

    return SystemHealthResponse(
        status="healthy",
        service="SIH26054 Digital Twin UAV Backend",
        timestamp=datetime.now(timezone.utc),
        database=db_status,
        active_engines=active_engines,
        total_telemetry_records=total_telemetry
    )

@router.get("/api/health/fleet-summary")
def get_fleet_health_summary(db: Session = Depends(get_db)):
    """Fleet-wide health distribution and key indicators."""
    engines = db.query(Engine).all()
    total = len(engines)
    active = sum(1 for e in engines if e.status == "ACTIVE")
    faulted = sum(1 for e in engines if e.status == "FAULT")
    idle = sum(1 for e in engines if e.status == "IDLE")

    return {
        "total_fleet_size": total,
        "active_count": active,
        "fault_count": faulted,
        "idle_count": idle,
        "system_status": "NORMAL" if faulted == 0 else "WARNING",
        "engines": [
            {
                "engine_id": e.id,
                "name": e.name,
                "status": e.status,
                "total_hours": e.total_hours
            }
            for e in engines
        ]
    }
