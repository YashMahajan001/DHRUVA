from typing import List, Optional
from sqlalchemy.orm import Session
from backend.app.models.engine import Engine, EngineModel
from backend.app.schemas.engine_schema import EngineCreate, EngineUpdate

class EngineService:
    def get_all(self, db: Session, skip: int = 0, limit: int = 100) -> List[Engine]:
        return db.query(Engine).offset(skip).limit(limit).all()

    def get_by_id(self, db: Session, engine_id: str) -> Optional[Engine]:
        eng = db.query(Engine).filter(Engine.id == engine_id).first()
        if eng:
            return eng
        # Try case-insensitive or normalized match (e.g. 'eng001', 'eng-01')
        norm = engine_id.replace("-", "").replace("_", "").upper()
        for e in db.query(Engine).all():
            if e.id.replace("-", "").replace("_", "").upper() == norm:
                return e
        # Try UAV / ENG index mapping (e.g. 'uav-01' -> 1st engine, 'uav-02' -> 2nd engine)
        all_engines = db.query(Engine).order_by(Engine.id).all()
        if all_engines and (engine_id.lower().startswith("uav-") or engine_id.lower().startswith("eng-")):
            try:
                parts = engine_id.split("-")
                num = int(parts[1])
                idx = (num - 1) % len(all_engines)
                return all_engines[idx]
            except (IndexError, ValueError):
                pass
        return None

    def create(self, db: Session, engine_in: EngineCreate) -> Engine:
        engine = Engine(
            id=engine_in.id,
            engine_model_id=engine_in.engine_model_id,
            name=engine_in.name,
            status=engine_in.status,
            total_hours=engine_in.total_hours
        )
        db.add(engine)
        db.commit()
        db.refresh(engine)
        return engine

    def update(self, db: Session, engine_id: str, engine_in: EngineUpdate) -> Optional[Engine]:
        engine = self.get_by_id(db, engine_id)
        if not engine:
            return None
        
        update_data = engine_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(engine, field, value)

        db.commit()
        db.refresh(engine)
        return engine

    def get_models(self, db: Session) -> List[EngineModel]:
        return db.query(EngineModel).all()

    def get_model_by_id(self, db: Session, model_id: str) -> Optional[EngineModel]:
        return db.query(EngineModel).filter(EngineModel.id == model_id).first()

engine_service = EngineService()
