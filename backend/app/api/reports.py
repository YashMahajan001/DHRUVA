from typing import List, Optional
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.schemas.reports_schema import ReportResponse
from backend.app.schemas.maintenance_schema import MaintenanceResponse, MaintenanceCreate
from backend.app.services.reports_service import reports_service
from backend.app.services.maintenance_service import maintenance_service
from backend.app.services.engine_service import engine_service
from backend.app.services.health_service import health_service
from backend.app.models.engine import Engine

router = APIRouter(tags=["Reports & Maintenance"])


@router.post("/mro/sync")
def trigger_mro_sync(db: Session = Depends(get_db)):
    """
    Trigger MRO (Maintenance, Repair & Overhaul) data sync.
    Inspects current engine health and creates predictive maintenance tasks
    for engines that show degraded health indicators.
    """
    engines = db.query(Engine).all()
    created_tasks = []
    skipped_engines = []

    for eng in engines:
        latest_twin = health_service.get_latest_health(db, eng.id)
        if not latest_twin:
            skipped_engines.append(eng.id)
            continue

        health_score = latest_twin.health_score
        predicted_state = latest_twin.predicted_state or {}
        anomalies = predicted_state.get("anomalies", [])
        detected_fault = predicted_state.get("detected_fault")

        # Generate maintenance task if health degraded
        if health_score < 80.0:
            fault_label = detected_fault or "general_degradation"
            maint_type = f"Predictive MRO — {fault_label} (health: {health_score:.0f}%)"
            notes_parts = [f"Auto-generated from MRO sync at health score {health_score:.1f}%."]
            if anomalies:
                notes_parts.append("Detected anomalies: " + "; ".join(anomalies))
            if detected_fault:
                notes_parts.append(f"Primary fault indicator: {detected_fault}")

            rul = predicted_state.get("rul_hours")
            if rul is not None:
                notes_parts.append(f"Estimated RUL: {rul:.1f} hours")

            # Schedule maintenance 7 days out or sooner if critical
            days_ahead = 2 if health_score < 50 else 7
            scheduled = datetime.now(timezone.utc) + timedelta(days=days_ahead)

            maint_in = MaintenanceCreate(
                engine_id=eng.id,
                maintenance_type=maint_type,
                scheduled_date=scheduled,
                status="SCHEDULED",
                notes=" | ".join(notes_parts),
            )
            record = maintenance_service.create(db, maint_in)
            created_tasks.append({
                "engine_id": eng.id,
                "maintenance_id": record.id,
                "maintenance_type": maint_type,
                "health_score": round(health_score, 1),
                "scheduled_date": scheduled.isoformat(),
            })
        else:
            skipped_engines.append(eng.id)

    return {
        "synced_at": datetime.now(timezone.utc).isoformat(),
        "total_engines_inspected": len(engines),
        "tasks_created": len(created_tasks),
        "skipped_engines": skipped_engines,
        "created_tasks": created_tasks,
    }

@router.get("/reports/{engine_id}", response_model=ReportResponse)
def get_engine_report(
    engine_id: str, db: Session = Depends(get_db)
):
    """Generate comprehensive diagnostic and operational health report for an engine."""
    engine = engine_service.get_by_id(db, engine_id)
    if not engine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Engine '{engine_id}' not found."
        )
    return reports_service.generate_engine_report(db, engine_id)

@router.get("/maintenance", response_model=List[MaintenanceResponse])
def get_maintenance_records(
    engine_id: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieve scheduled and completed maintenance records."""
    return maintenance_service.get_all(db, engine_id=engine_id, status=status)

@router.post("/maintenance", response_model=MaintenanceResponse, status_code=status.HTTP_201_CREATED)
def create_maintenance_record(
    maintenance_in: MaintenanceCreate, db: Session = Depends(get_db)
):
    """Schedule a new maintenance event for an engine."""
    engine = engine_service.get_by_id(db, maintenance_in.engine_id)
    if not engine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Engine '{maintenance_in.engine_id}' not found."
        )
    return maintenance_service.create(db, maintenance_in)

@router.patch("/maintenance/{maintenance_id}/status", response_model=MaintenanceResponse)
def update_maintenance_status(
    maintenance_id: int, status: str, db: Session = Depends(get_db)
):
    """Update status of a maintenance task (e.g. IN_PROGRESS, COMPLETED)."""
    record = maintenance_service.update_status(db, maintenance_id, status)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Maintenance record #{maintenance_id} not found."
        )
    return record
