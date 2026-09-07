from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from backend.app.models.engine import Engine
from backend.app.models.telemetry import Telemetry
from backend.app.models.twin_state import TwinState
from backend.app.models.fault import Fault
from backend.app.schemas.health_schema import DigitalTwinEvaluationResult

class HealthService:
    def evaluate_telemetry(
        self, db: Session, telemetry_record: Telemetry, engine: Optional[Engine] = None
    ) -> DigitalTwinEvaluationResult:
        """
        Evaluates incoming telemetry using the Digital Twin & safety envelope rules.
        Calculates health score (0-100), operational status, anomaly detection, and RUL hours.
        """
        if not engine:
            engine = db.query(Engine).filter(Engine.id == telemetry_record.engine_id).first()

        max_rpm = 2700
        max_temp = 240.0
        if engine and engine.engine_model:
            max_rpm = engine.engine_model.max_rpm
            max_temp = engine.engine_model.max_temperature

        health_score = 100.0
        anomalies: List[str] = []
        active_fault = None

        # 1. Temperature Evaluation
        if telemetry_record.temperature > max_temp:
            health_score -= 35.0
            anomalies.append(f"High Temperature: {telemetry_record.temperature:.1f}°C > {max_temp}°C")
            active_fault = "overheating"
        elif telemetry_record.temperature > (max_temp * 0.90):
            health_score -= 15.0
            anomalies.append(f"Elevated Temperature: {telemetry_record.temperature:.1f}°C")

        # 2. Oil Pressure Evaluation (normal: 30 - 65 psi)
        if telemetry_record.oil_pressure < 20.0:
            health_score -= 40.0
            anomalies.append(f"Critical Low Oil Pressure: {telemetry_record.oil_pressure:.1f} psi")
            active_fault = active_fault or "low_oil_pressure"
        elif telemetry_record.oil_pressure < 30.0:
            health_score -= 15.0
            anomalies.append(f"Low Oil Pressure Warning: {telemetry_record.oil_pressure:.1f} psi")

        # 3. RPM Overspeed Evaluation
        if telemetry_record.rpm > (max_rpm * 1.05):
            health_score -= 30.0
            anomalies.append(f"RPM Overspeed: {telemetry_record.rpm:.0f} > {max_rpm}")
            active_fault = active_fault or "abnormal_rpm"

        # 4. Abnormal Fuel Flow / Throttle Mismatch
        if telemetry_record.throttle > 80 and telemetry_record.fuel_flow > 35.0:
            health_score -= 10.0
            anomalies.append("Excessive fuel consumption under high throttle")
            active_fault = active_fault or "excessive_fuel"

        health_score = max(5.0, min(100.0, health_score))

        if health_score >= 80.0:
            health_status = "GOOD"
        elif health_score >= 50.0:
            health_status = "WARNING"
        else:
            health_status = "CRITICAL"

        # Calculate estimated RUL (Remaining Useful Life in hours)
        base_tbo = 2000.0 # Time Between Overhauls
        hours_run = engine.total_hours if engine else 100.0
        degradation_factor = (100.0 - health_score) * 2.5
        rul_hours = max(0.0, round((base_tbo - hours_run - degradation_factor), 1))

        # Check for uncompleted registered faults in DB
        db_fault = db.query(Fault).filter(
            Fault.engine_id == telemetry_record.engine_id,
            Fault.resolved == False
        ).order_by(Fault.id.desc()).first()

        if db_fault:
            active_fault = db_fault.fault_type
            if db_fault.severity == "CRITICAL":
                health_score = min(health_score, 40.0)
                health_status = "CRITICAL"

        # Persist TwinState record
        twin_state = TwinState(
            engine_id=telemetry_record.engine_id,
            timestamp=telemetry_record.timestamp,
            health_score=health_score,
            health_status=health_status,
            predicted_state={
                "anomalies": anomalies,
                "detected_fault": active_fault,
                "rul_hours": rul_hours,
                "components": {
                    "thermodynamics": "NOMINAL" if telemetry_record.temperature <= max_temp * 0.90 else "DEGRADED",
                    "lubrication": "NOMINAL" if telemetry_record.oil_pressure >= 30.0 else "DEGRADED",
                    "combustion": "NOMINAL" if telemetry_record.rpm <= max_rpm else "DEGRADED"
                }
            }
        )
        db.add(twin_state)
        db.commit()

        return DigitalTwinEvaluationResult(
            engine_id=telemetry_record.engine_id,
            timestamp=telemetry_record.timestamp,
            health_score=round(health_score, 1),
            health_status=health_status,
            anomaly=len(anomalies) > 0,
            fault=active_fault,
            rul_hours=rul_hours,
            details=twin_state.predicted_state
        )

    def get_latest_health(self, db: Session, engine_id: str) -> Optional[TwinState]:
        return db.query(TwinState).filter(
            TwinState.engine_id == engine_id
        ).order_by(TwinState.timestamp.desc(), TwinState.id.desc()).first()

    def get_health_history(self, db: Session, engine_id: str, limit: int = 50) -> List[TwinState]:
        return db.query(TwinState).filter(
            TwinState.engine_id == engine_id
        ).order_by(TwinState.timestamp.desc(), TwinState.id.desc()).limit(limit).all()

health_service = HealthService()
