from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from backend.app.models.fault import Fault
from backend.app.models.engine import Engine
from backend.app.schemas.fault_schema import FaultInjectRequest, FaultCreate

class FaultService:
    def get_all(
        self, db: Session, engine_id: Optional[str] = None, resolved: Optional[bool] = None, limit: int = 100
    ) -> List[Fault]:
        query = db.query(Fault)
        if engine_id:
            query = query.filter(Fault.engine_id == engine_id)
        if resolved is not None:
            query = query.filter(Fault.resolved == resolved)
        return query.order_by(Fault.timestamp.desc(), Fault.id.desc()).limit(limit).all()

    def get_by_id(self, db: Session, fault_id: int) -> Optional[Fault]:
        return db.query(Fault).filter(Fault.id == fault_id).first()

    def inject_fault(self, db: Session, request: FaultInjectRequest) -> Fault:
        desc = request.description or f"Controlled fault injection: {request.fault_type} (magnitude {request.magnitude})"
        fault = Fault(
            engine_id=request.engine_id,
            timestamp=datetime.now(timezone.utc),
            fault_type=request.fault_type,
            severity=request.severity,
            description=desc,
            resolved=False
        )
        db.add(fault)
        
        # Update engine status to FAULT if critical
        if request.severity in ("HIGH", "CRITICAL"):
            engine = db.query(Engine).filter(Engine.id == request.engine_id).first()
            if engine:
                engine.status = "FAULT"

        db.commit()
        db.refresh(fault)
        return fault

    def resolve_fault(self, db: Session, fault_id: int) -> Optional[Fault]:
        fault = self.get_by_id(db, fault_id)
        if not fault:
            return None
        fault.resolved = True
        fault.resolved_at = datetime.now(timezone.utc)
        
        # Check if engine still has other unresolved high/critical faults
        unresolved = db.query(Fault).filter(
            Fault.engine_id == fault.engine_id,
            Fault.resolved == False,
            Fault.id != fault_id
        ).count()
        if unresolved == 0:
            engine = db.query(Engine).filter(Engine.id == fault.engine_id).first()
            if engine and engine.status == "FAULT":
                engine.status = "ACTIVE"

        db.commit()
        db.refresh(fault)
        return fault

fault_service = FaultService()
