from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.schemas.engine_schema import (
    EngineResponse, EngineCreate, EngineUpdate, EngineModelResponse
)
from backend.app.schemas.telemetry_schema import TelemetryResponse
from backend.app.schemas.health_schema import TwinStateResponse
from backend.app.schemas.fault_schema import FaultResponse
from backend.app.services.engine_service import engine_service
from backend.app.services.telemetry_service import telemetry_service
from backend.app.services.health_service import health_service
from backend.app.services.fault_service import fault_service

router = APIRouter(prefix="/engines", tags=["Engines"])

@router.get("", response_model=List[EngineResponse])
def get_engines(
    skip: int = 0, limit: int = 100, db: Session = Depends(get_db)
):
    """Retrieve all UAV engines across the fleet."""
    return engine_service.get_all(db, skip=skip, limit=limit)

@router.post("", response_model=EngineResponse, status_code=status.HTTP_201_CREATED)
def create_engine(
    engine_in: EngineCreate, db: Session = Depends(get_db)
):
    """Register a new UAV engine."""
    existing = engine_service.get_by_id(db, engine_in.id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Engine with ID '{engine_in.id}' already exists."
        )
    return engine_service.create(db, engine_in)

@router.get("/models", response_model=List[EngineModelResponse])
def get_engine_models(db: Session = Depends(get_db)):
    """Retrieve all supported engine models (Lycoming O-320, Rotax 914, AE300)."""
    return engine_service.get_models(db)

@router.get("/{engine_id}", response_model=EngineResponse)
def get_engine(
    engine_id: str, db: Session = Depends(get_db)
):
    """Retrieve details for a specific engine."""
    engine = engine_service.get_by_id(db, engine_id)
    if not engine:
        raise HTTPException(status_code=404, detail=f"Engine '{engine_id}' not found.")
    return engine

@router.patch("/{engine_id}", response_model=EngineResponse)
def update_engine(
    engine_id: str, engine_in: EngineUpdate, db: Session = Depends(get_db)
):
    """Update engine operational status or metadata."""
    engine = engine_service.update(db, engine_id, engine_in)
    if not engine:
        raise HTTPException(status_code=404, detail=f"Engine '{engine_id}' not found.")
    return engine

@router.get("/{engine_id}/telemetry", response_model=List[TelemetryResponse])
def get_engine_telemetry(
    engine_id: str,
    limit: int = Query(default=100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """Retrieve recent time-series telemetry records for this engine."""
    engine = engine_service.get_by_id(db, engine_id)
    if not engine:
        raise HTTPException(status_code=404, detail=f"Engine '{engine_id}' not found.")
    return telemetry_service.get_history(db, engine_id, limit=limit)

@router.get("/{engine_id}/health")
def get_engine_health(
    engine_id: str, db: Session = Depends(get_db)
):
    """Retrieve latest Digital Twin health state for this engine."""
    engine = engine_service.get_by_id(db, engine_id)
    if not engine:
        raise HTTPException(status_code=404, detail=f"Engine '{engine_id}' not found.")
    
    twin_state = health_service.get_latest_health(db, engine_id)
    if not twin_state:
        # Default state if no telemetry received yet
        return {
            "engine_id": engine_id,
            "health_score": 100.0,
            "health_status": "GOOD",
            "anomaly": False,
            "fault": None,
            "rul_hours": 1900.0 - engine.total_hours
        }

    return {
        "engine_id": engine_id,
        "timestamp": twin_state.timestamp.isoformat(),
        "health_score": twin_state.health_score,
        "health_status": twin_state.health_status,
        "anomaly": twin_state.health_status != "GOOD",
        "fault": twin_state.predicted_state.get("detected_fault") if twin_state.predicted_state else None,
        "rul_hours": twin_state.predicted_state.get("rul_hours") if twin_state.predicted_state else 1500.0,
        "predicted_state": twin_state.predicted_state
    }

@router.get("/{engine_id}/faults", response_model=List[FaultResponse])
def get_engine_faults(
    engine_id: str,
    resolved: Optional[bool] = None,
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """Retrieve active and historical faults for this engine."""
    engine = engine_service.get_by_id(db, engine_id)
    if not engine:
        raise HTTPException(status_code=404, detail=f"Engine '{engine_id}' not found.")
    return fault_service.get_all(db, engine_id=engine_id, resolved=resolved, limit=limit)
