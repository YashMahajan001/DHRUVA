from fastapi import APIRouter
from backend.app.api.engines import router as engines_router
from backend.app.api.telemetry import router as telemetry_router
from backend.app.api.health import router as health_router
from backend.app.api.faults import router as faults_router
from backend.app.api.missions import router as missions_router
from backend.app.api.tuning import router as tuning_router
from backend.app.api.replay import router as replay_router
from backend.app.api.reports import router as reports_router

api_router = APIRouter()

api_router.include_router(engines_router)
api_router.include_router(telemetry_router)
api_router.include_router(health_router)
api_router.include_router(faults_router)
api_router.include_router(missions_router)
api_router.include_router(tuning_router)
api_router.include_router(replay_router)
api_router.include_router(reports_router)
