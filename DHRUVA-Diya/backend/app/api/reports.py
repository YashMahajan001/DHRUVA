from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.schemas.reports_schema import ReportResponse
from backend.app.schemas.maintenance_schema import MaintenanceResponse, MaintenanceCreate
from backend.app.services.reports_service import reports_service
from backend.app.services.maintenance_service import maintenance_service
from backend.app.services.engine_service import engine_service

router = APIRouter(tags=["Reports & Maintenance"])

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
