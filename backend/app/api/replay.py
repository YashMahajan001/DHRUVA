from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.schemas.replay_schema import ReplayResponse
from backend.app.services.replay_service import replay_service

router = APIRouter(prefix="/replay", tags=["Replay"])

@router.get("/{mission_id}", response_model=ReplayResponse)
def get_mission_replay(
    mission_id: str, db: Session = Depends(get_db)
):
    """Retrieve chronological telemetry time-series to replay a flight mission."""
    result = replay_service.get_mission_replay(db, mission_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mission '{mission_id}' not found for replay."
        )
    return result
