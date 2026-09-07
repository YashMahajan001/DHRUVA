from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.api.engines import router as engines_router
from backend.app.api.telemetry import router as telemetry_router
from backend.app.api.health import router as health_router
from backend.app.api.faults import router as faults_router
from backend.app.api.missions import router as missions_router
from backend.app.api.tuning import router as tuning_router
from backend.app.api.replay import router as replay_router
from backend.app.api.reports import router as reports_router
from backend.app.api.alerts import router as alerts_router
from backend.app.api.subsystems import router as subsystems_router
from backend.app.api.agent import router as agent_router
from backend.app.api.fleet import router as fleet_router

api_router = APIRouter()

# Original routers
api_router.include_router(engines_router)
api_router.include_router(telemetry_router)
api_router.include_router(health_router)
api_router.include_router(faults_router)
api_router.include_router(missions_router)
api_router.include_router(tuning_router)
api_router.include_router(replay_router)
api_router.include_router(reports_router)

# New routers — added to serve missing endpoints from api_endpoints_summary.md
api_router.include_router(alerts_router)
api_router.include_router(subsystems_router)
api_router.include_router(agent_router)
api_router.include_router(fleet_router)


# ── Singular /mission route ────────────────────────────────────────────────────
# The frontend calls GET /api/mission (singular) for the current active mission.
# The missions router is at /missions (plural). This standalone route bridges the gap.
from backend.app.database.session import get_db
from backend.app.schemas.mission_schema import MissionResponse
from backend.app.models.mission import Mission


@api_router.get("/mission", response_model=MissionResponse, tags=["Missions"])
def get_current_mission(db: Session = Depends(get_db)):
    """Get the current active mission (singular endpoint for dashboard)."""
    active = (
        db.query(Mission)
        .filter(Mission.status == "IN_PROGRESS")
        .order_by(Mission.start_time.desc())
        .first()
    )
    if not active:
        active = (
            db.query(Mission)
            .filter(Mission.status == "PLANNED")
            .order_by(Mission.start_time.desc())
            .first()
        )
    if not active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active mission found."
        )
    return active
