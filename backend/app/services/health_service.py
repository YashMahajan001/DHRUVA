import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List

from sqlalchemy.orm import Session
from backend.app.models.engine import Engine
from backend.app.models.telemetry import Telemetry
from backend.app.models.twin_state import TwinState
from backend.app.models.fault import Fault
from backend.app.schemas.health_schema import DigitalTwinEvaluationResult

logger = logging.getLogger("backend.health")

try:
    from ml.inference.inference_service import run_inference
except ImportError:
    run_inference = None

class HealthService:
    def evaluate_telemetry(
        self, db: Session, telemetry_record: Telemetry, engine: Optional[Engine] = None
    ) -> DigitalTwinEvaluationResult:
        """
        Evaluates incoming telemetry using the Digital Twin physics, ML inference pipeline,
        and safety envelope rules. Calculates health score (0-100), operational status,
        anomaly detection, and RUL hours.
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
        ml_result = None

        # 1. Run ML inference pipeline if available
        if run_inference:
            try:
                telem_dict = {
                    "engine_id": telemetry_record.engine_id,
                    "timestamp": telemetry_record.timestamp,
                    "rpm": telemetry_record.rpm,
                    "cht": telemetry_record.temperature,
                    "temperature": telemetry_record.temperature,
                    "oil_pressure": telemetry_record.oil_pressure,
                    "oil_temperature": getattr(telemetry_record, "oil_temperature", 85.0),
                    "fuel_flow": telemetry_record.fuel_flow,
                    "altitude": telemetry_record.altitude,
                    "throttle": telemetry_record.throttle,
                    "vibration_rms": getattr(telemetry_record, "vibration_rms", 1.8),
                }
                ml_result = run_inference(telem_dict)
                if ml_result.get("anomaly", {}).get("detected"):
                    anomalies.append(f"ML Anomaly Detected: score {ml_result['anomaly'].get('score', 0.0):.2f}")
                fault_info = ml_result.get("fault", {})
                if fault_info.get("type") and fault_info.get("type") != "healthy":
                    active_fault = fault_info.get("type")
            except Exception as e:
                logger.warning(f"ML inference pipeline error (falling back to physics rules): {e}")

        # 2. Physics & Safety Envelope Rules
        if telemetry_record.temperature > max_temp:
            health_score -= 35.0
            anomalies.append(f"High Temperature: {telemetry_record.temperature:.1f}°C > {max_temp}°C")
            active_fault = active_fault or "overheating"
        elif telemetry_record.temperature > (max_temp * 0.90):
            health_score -= 15.0
            anomalies.append(f"Elevated Temperature: {telemetry_record.temperature:.1f}°C")

        # 3. Oil Pressure Evaluation (normal: 30 - 65 psi)
        if telemetry_record.oil_pressure < 20.0:
            health_score -= 40.0
            anomalies.append(f"Critical Low Oil Pressure: {telemetry_record.oil_pressure:.1f} psi")
            active_fault = active_fault or "low_oil_pressure"
        elif telemetry_record.oil_pressure < 30.0:
            health_score -= 15.0
            anomalies.append(f"Low Oil Pressure Warning: {telemetry_record.oil_pressure:.1f} psi")

        # 4. RPM Overspeed Evaluation
        if telemetry_record.rpm > (max_rpm * 1.05):
            health_score -= 30.0
            anomalies.append(f"RPM Overspeed: {telemetry_record.rpm:.0f} > {max_rpm}")
            active_fault = active_fault or "abnormal_rpm"

        # 5. Abnormal Fuel Flow / Throttle Mismatch
        if telemetry_record.throttle > 80 and telemetry_record.fuel_flow > 35.0:
            health_score -= 10.0
            anomalies.append("Excessive fuel consumption under high throttle")
            active_fault = active_fault or "excessive_fuel"

        # Blend ML health score if available
        if ml_result and "health_index" in ml_result:
            ml_health = float(ml_result["health_index"])
            health_score = (health_score * 0.5) + (ml_health * 0.5)


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
