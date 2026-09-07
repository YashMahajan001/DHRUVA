from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.schemas.mission_schema import (
    MissionResponse, MissionCreate, MissionSimulateRequest
)
from backend.app.services.mission_service import mission_service
from backend.app.services.engine_service import engine_service

router = APIRouter(prefix="/missions", tags=["Missions"])

@router.get("", response_model=List[MissionResponse])
def get_missions(
    engine_id: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieve all UAV flight missions."""
    return mission_service.get_all(db, engine_id=engine_id, status=status)

@router.post("", response_model=MissionResponse, status_code=status.HTTP_201_CREATED)
def create_mission(
    mission_in: MissionCreate, db: Session = Depends(get_db)
):
    """Plan a new UAV flight mission."""
    engine = engine_service.get_by_id(db, mission_in.engine_id)
    if not engine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Engine '{mission_in.engine_id}' not found."
        )
    existing = mission_service.get_by_id(db, mission_in.id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Mission '{mission_in.id}' already exists."
        )
    return mission_service.create(db, mission_in)

@router.get("/{mission_id}", response_model=MissionResponse)
def get_mission(
    mission_id: str, db: Session = Depends(get_db)
):
    """Retrieve details of a specific mission."""
    mission = mission_service.get_by_id(db, mission_id)
    if not mission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mission '{mission_id}' not found."
        )
    return mission

@router.post("/{mission_id}/simulate")
def simulate_mission(
    mission_id: str,
    req: MissionSimulateRequest,
    db: Session = Depends(get_db)
):
    """Simulate a flight mission profile with optional fault injection."""
    result = mission_service.simulate_mission(db, mission_id, req)
    if "error" in result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=result["error"]
        )
    return result
