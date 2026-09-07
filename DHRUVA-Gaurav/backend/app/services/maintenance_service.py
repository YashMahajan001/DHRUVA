from typing import List, Optional
from sqlalchemy.orm import Session
from backend.app.models.maintenance import Maintenance
from backend.app.schemas.maintenance_schema import MaintenanceCreate

class MaintenanceService:
    def get_all(
        self, db: Session, engine_id: Optional[str] = None, status: Optional[str] = None
    ) -> List[Maintenance]:
        query = db.query(Maintenance)
        if engine_id:
            query = query.filter(Maintenance.engine_id == engine_id)
        if status:
            query = query.filter(Maintenance.status == status)
        return query.order_by(Maintenance.scheduled_date.asc()).all()

    def get_by_id(self, db: Session, maintenance_id: int) -> Optional[Maintenance]:
        return db.query(Maintenance).filter(Maintenance.id == maintenance_id).first()

    def create(self, db: Session, maintenance_in: MaintenanceCreate) -> Maintenance:
        record = Maintenance(
            engine_id=maintenance_in.engine_id,
            maintenance_type=maintenance_in.maintenance_type,
            scheduled_date=maintenance_in.scheduled_date,
            status=maintenance_in.status,
            notes=maintenance_in.notes
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

    def update_status(self, db: Session, maintenance_id: int, status: str) -> Optional[Maintenance]:
        record = self.get_by_id(db, maintenance_id)
        if not record:
            return None
        record.status = status
        db.commit()
        db.refresh(record)
        return record

maintenance_service = MaintenanceService()
