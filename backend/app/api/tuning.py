from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.schemas.tuning_schema import TuneProfileCreate, TuneProfileResponse
from backend.app.services.tuning_service import tuning_service
from backend.app.services.engine_service import engine_service

router = APIRouter(prefix="/tuning", tags=["Tuning"])


@router.get("/candidates")
def get_tuning_candidates():
    """
    Get tuning candidate configurations (alpha/beta/gamma) for engine calibration.
    These are predefined optimisation profiles the frontend presents for selection.
    """
    return [
        {
            "id": "alpha",
            "name": "Alpha — Fuel Efficiency",
            "description": "Optimised for maximum fuel economy during long-endurance ISR missions.",
            "parameters": {
                "fuel_air_ratio_bias": -0.08,
                "idle_rpm_target": 900,
                "max_throttle_limit": 92.0,
                "turbo_wastegate_bias": 0.05,
                "ignition_advance_deg": 24.0,
            },
            "recommended_for": ["high_altitude_isr", "loiter", "long_endurance"],
        },
        {
            "id": "beta",
            "name": "Beta — Balanced Performance",
            "description": "Balanced profile for general-purpose missions with moderate power and efficiency.",
            "parameters": {
                "fuel_air_ratio_bias": 0.0,
                "idle_rpm_target": 950,
                "max_throttle_limit": 98.0,
                "turbo_wastegate_bias": 0.10,
                "ignition_advance_deg": 22.0,
            },
            "recommended_for": ["tactical_recon", "patrol", "mixed"],
        },
        {
            "id": "gamma",
            "name": "Gamma — Maximum Power",
            "description": "Optimised for high-power climb and dash phases. Higher fuel consumption, cooler EGTs.",
            "parameters": {
                "fuel_air_ratio_bias": 0.05,
                "idle_rpm_target": 1000,
                "max_throttle_limit": 100.0,
                "turbo_wastegate_bias": 0.15,
                "ignition_advance_deg": 20.0,
            },
            "recommended_for": ["intercept", "high_altitude_climb", "emergency"],
        },
    ]


@router.post("", response_model=TuneProfileResponse, status_code=status.HTTP_201_CREATED)
def create_tune_profile(
    profile_in: TuneProfileCreate, db: Session = Depends(get_db)
):
    """Save a new engine calibration and tuning profile."""
    engine = engine_service.get_by_id(db, profile_in.engine_id)
    if not engine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Engine '{profile_in.engine_id}' not found."
        )
    return tuning_service.create_profile(db, profile_in)

@router.get("/{profile_id}", response_model=TuneProfileResponse)
def get_tune_profile(
    profile_id: int, db: Session = Depends(get_db)
):
    """Retrieve tune profile by ID."""
    profile = tuning_service.get_by_id(db, profile_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tune profile #{profile_id} not found."
        )
    return profile

@router.get("/engine/{engine_id}", response_model=List[TuneProfileResponse])
def get_engine_tune_profiles(
    engine_id: str, db: Session = Depends(get_db)
):
    """Retrieve all tuning profiles configured for a specific engine."""
    return tuning_service.get_by_engine(db, engine_id)
