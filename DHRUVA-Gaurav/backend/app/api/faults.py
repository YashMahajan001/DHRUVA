from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.schemas.fault_schema import FaultResponse, FaultInjectRequest
from backend.app.services.fault_service import fault_service
from backend.app.services.engine_service import engine_service

router = APIRouter(prefix="/faults", tags=["Faults"])

@router.get("", response_model=List[FaultResponse])
def get_faults(
    engine_id: Optional[str] = None,
    resolved: Optional[bool] = None,
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """Retrieve fault logs across the fleet or filtered by engine."""
    return fault_service.get_all(db, engine_id=engine_id, resolved=resolved, limit=limit)

@router.post("/inject", response_model=FaultResponse, status_code=status.HTTP_201_CREATED)
def inject_fault(
    payload: FaultInjectRequest, db: Session = Depends(get_db)
):
    """
    Injects a controlled fault (e.g. overheating, low_oil_pressure, abnormal_rpm, excessive_fuel).
    Updates fleet status and generates anomaly signals for Digital Twin / ML testing.
    """
    engine = engine_service.get_by_id(db, payload.engine_id)
    if not engine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Engine '{payload.engine_id}' not found."
        )
    return fault_service.inject_fault(db, payload)

@router.patch("/{fault_id}/resolve", response_model=FaultResponse)
def resolve_fault(
    fault_id: int, db: Session = Depends(get_db)
):
    """Mark a fault as resolved and restore nominal engine operational status."""
    fault = fault_service.resolve_fault(db, fault_id)
    if not fault:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Fault record #{fault_id} not found."
        )
    return fault
