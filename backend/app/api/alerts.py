from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from backend.app.database.session import get_db
from backend.app.models.fault import Fault
from backend.app.models.engine import Engine
from backend.app.services.fault_service import fault_service

router = APIRouter(prefix="/alerts", tags=["Alerts"])


class AlertResponse(BaseModel):
    """Alert view of a fault record — matches the frontend's expected shape."""
    id: int
    engine_id: str
    timestamp: datetime
    alert_type: str
    severity: str
    description: Optional[str] = None
    acknowledged: bool = False
    acknowledged_at: Optional[datetime] = None
    resolved: bool = False
    resolved_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

    @classmethod
    def from_fault(cls, fault: Fault) -> "AlertResponse":
        return cls(
            id=fault.id,
            engine_id=fault.engine_id,
            timestamp=fault.timestamp,
            alert_type=fault.fault_type,
            severity=fault.severity,
            description=fault.description,
            # Map resolved status to acknowledged for alert semantics
            acknowledged=fault.resolved,
            acknowledged_at=fault.resolved_at,
            resolved=fault.resolved,
            resolved_at=fault.resolved_at,
            created_at=fault.created_at,
        )


@router.get("", response_model=List[AlertResponse])
def get_alerts(
    engine_id: Optional[str] = None,
    severity: Optional[str] = None,
    acknowledged: Optional[bool] = None,
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """
    List active fault/alert events across the fleet.
    Supports optional filtering by engine, severity, and acknowledgement status.
    """
    query = db.query(Fault)
    if engine_id:
        query = query.filter(Fault.engine_id == engine_id)
    if severity:
        query = query.filter(Fault.severity == severity)
    if acknowledged is not None:
        query = query.filter(Fault.resolved == acknowledged)
    faults = query.order_by(Fault.timestamp.desc(), Fault.id.desc()).limit(limit).all()
    return [AlertResponse.from_fault(f) for f in faults]


@router.patch("/{alert_id}/ack", response_model=AlertResponse)
def acknowledge_alert(
    alert_id: int, db: Session = Depends(get_db),
):
    """
    Acknowledge an alert. Sets the fault as resolved and records the acknowledgement timestamp.
    """
    fault = fault_service.get_by_id(db, alert_id)
    if not fault:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert #{alert_id} not found.",
        )
    if fault.resolved:
        # Already acknowledged — return current state
        return AlertResponse.from_fault(fault)

    fault.resolved = True
    fault.resolved_at = datetime.now(timezone.utc)

    # Restore engine status if no other unresolved faults remain
    unresolved = (
        db.query(Fault)
        .filter(
            Fault.engine_id == fault.engine_id,
            Fault.resolved == False,
            Fault.id != fault.id,
        )
        .count()
    )
    if unresolved == 0:
        engine = db.query(Engine).filter(Engine.id == fault.engine_id).first()
        if engine and engine.status == "FAULT":
            engine.status = "ACTIVE"

    db.commit()
    db.refresh(fault)
    return AlertResponse.from_fault(fault)
