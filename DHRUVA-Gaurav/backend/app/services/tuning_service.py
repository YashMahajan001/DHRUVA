from typing import List, Optional
from sqlalchemy.orm import Session
from backend.app.models.tune_profile import TuneProfile
from backend.app.schemas.tuning_schema import TuneProfileCreate

class TuningService:
    def get_by_id(self, db: Session, profile_id: int) -> Optional[TuneProfile]:
        return db.query(TuneProfile).filter(TuneProfile.id == profile_id).first()

    def get_by_engine(self, db: Session, engine_id: str) -> List[TuneProfile]:
        return db.query(TuneProfile).filter(TuneProfile.engine_id == engine_id).order_by(TuneProfile.id.desc()).all()

    def create_profile(self, db: Session, profile_in: TuneProfileCreate) -> TuneProfile:
        profile = TuneProfile(
            name=profile_in.name,
            engine_id=profile_in.engine_id,
            parameters=profile_in.parameters
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
        return profile

tuning_service = TuningService()
