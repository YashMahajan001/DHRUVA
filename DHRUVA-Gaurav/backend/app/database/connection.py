import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.core.config import settings
from backend.app.database.base import Base

# Import all models so that Base.metadata has full table definitions
import backend.app.models  # noqa: F401

logger = logging.getLogger("backend.database")

def get_engine():
    db_url = settings.DATABASE_URL
    connect_args = {}
    
    if db_url.startswith("sqlite"):
        connect_args["check_same_thread"] = False
        
    try:
        engine = create_engine(
            db_url,
            connect_args=connect_args,
            pool_pre_ping=True
        )
        # Test connection
        with engine.connect() as conn:
            pass
        logger.info(f"Connected to database at {db_url.split('@')[-1] if '@' in db_url else db_url}")
        return engine
    except Exception as e:
        logger.warning(f"Failed to connect to primary database ({db_url}): {e}")
        fallback_url = settings.SQLITE_FALLBACK_URL
        logger.info(f"Falling back to SQLite database: {fallback_url}")
        return create_engine(
            fallback_url,
            connect_args={"check_same_thread": False},
            pool_pre_ping=True
        )

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    """Initializes tables and seeds default engine models if empty."""
    Base.metadata.create_all(bind=engine)
    
    # Check if seed is needed
    from backend.app.models.engine import EngineModel, Engine
    from backend.app.models.mission import Mission
    from datetime import datetime, timezone, timedelta

    db = SessionLocal()
    try:
        if db.query(EngineModel).count() == 0:
            logger.info("Seeding initial engine models...")
            models = [
                EngineModel(
                    id="MDL-O320",
                    name="Lycoming O-320-D2J",
                    manufacturer="Lycoming",
                    model="O-320",
                    type="4-Cylinder Horizontally Opposed",
                    max_rpm=2700,
                    max_temperature=260.0
                ),
                EngineModel(
                    id="MDL-ROTAX914",
                    name="Rotax 914 F/UL",
                    manufacturer="BRP-Rotax",
                    model="914",
                    type="4-Cylinder Turbocharged",
                    max_rpm=5800,
                    max_temperature=135.0
                ),
                EngineModel(
                    id="MDL-AE300",
                    name="Austro Engine AE300",
                    manufacturer="Austro Engine",
                    model="AE300",
                    type="4-Cylinder Inline Turbo Diesel",
                    max_rpm=3880,
                    max_temperature=140.0
                ),
            ]
            db.add_all(models)
            db.commit()

        if db.query(Engine).count() == 0:
            logger.info("Seeding initial engines...")
            engines = [
                Engine(id="ENG001", engine_model_id="MDL-O320", name="Eagle-1 Primary Engine", status="ACTIVE", total_hours=142.5),
                Engine(id="ENG002", engine_model_id="MDL-ROTAX914", name="Falcon-2 Surveillance Engine", status="ACTIVE", total_hours=88.0),
                Engine(id="ENG003", engine_model_id="MDL-AE300", name="Predator-3 Heavy Endurance Engine", status="IDLE", total_hours=210.3),
            ]
            db.add_all(engines)
            db.commit()

        if db.query(Mission).count() == 0:
            logger.info("Seeding initial missions...")
            now = datetime.now(timezone.utc)
            missions = [
                Mission(
                    id="MSN-001",
                    name="High Altitude ISR Alpha",
                    engine_id="ENG001",
                    mission_type="high_altitude_isr",
                    start_time=now - timedelta(hours=4),
                    end_time=now - timedelta(hours=1),
                    status="COMPLETED"
                ),
                Mission(
                    id="MSN-002",
                    name="Border Patrol Long Endurance",
                    engine_id="ENG002",
                    mission_type="long_endurance",
                    start_time=now - timedelta(minutes=30),
                    end_time=None,
                    status="IN_PROGRESS"
                ),
                Mission(
                    id="MSN-003",
                    name="Coastal Rapid Response Recon",
                    engine_id="ENG001",
                    mission_type="rapid_response",
                    start_time=now + timedelta(hours=2),
                    end_time=None,
                    status="PLANNED"
                ),
            ]
            db.add_all(missions)
            db.commit()
    except Exception as e:
        logger.error(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()
