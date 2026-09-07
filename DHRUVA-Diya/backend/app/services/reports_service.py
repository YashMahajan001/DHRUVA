from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from backend.app.models.engine import Engine
from backend.app.models.twin_state import TwinState
from backend.app.models.fault import Fault
from backend.app.models.telemetry import Telemetry
from backend.app.schemas.reports_schema import ReportResponse

class ReportsService:
    def generate_engine_report(self, db: Session, engine_id: str) -> Optional[ReportResponse]:
        engine = db.query(Engine).filter(Engine.id == engine_id).first()
        if not engine:
            return None

        # Fetch latest twin state
        latest_twin = db.query(TwinState).filter(
            TwinState.engine_id == engine_id
        ).order_by(TwinState.timestamp.desc(), TwinState.id.desc()).first()

        health_score = latest_twin.health_score if latest_twin else 100.0
        health_status = latest_twin.health_status if latest_twin else "GOOD"

        # Fetch active faults
        active_faults = db.query(Fault).filter(
            Fault.engine_id == engine_id,
            Fault.resolved == False
        ).order_by(Fault.id.desc()).all()

        faults_summary = [
            {
                "fault_id": f.id,
                "type": f.fault_type,
                "severity": f.severity,
                "description": f.description,
                "timestamp": f.timestamp.isoformat()
            }
            for f in active_faults
        ]

        # Fetch recent telemetry stats
        recent_telemetry = db.query(Telemetry).filter(
            Telemetry.engine_id == engine_id
        ).order_by(Telemetry.timestamp.desc()).limit(30).all()

        avg_temp = (sum(t.temperature for t in recent_telemetry) / len(recent_telemetry)) if recent_telemetry else 0.0
        avg_oil = (sum(t.oil_pressure for t in recent_telemetry) / len(recent_telemetry)) if recent_telemetry else 0.0
        max_rpm = max((t.rpm for t in recent_telemetry), default=0.0)

        # Generate rule-based recommendations
        recommendations = []
        if health_score < 60.0:
            recommendations.append("Immediate ground inspection required before next sortie.")
        if any(f.severity in ("HIGH", "CRITICAL") for f in active_faults):
            recommendations.append("Perform critical diagnostics on thermal and lubrication subsystems.")
        if avg_oil < 30.0 and recent_telemetry:
            recommendations.append("Inspect oil filter and check for oil line pressure degradation.")
        if not recommendations:
            recommendations.append("All engine telemetry parameters nominal. Cleared for flight.")

        report_id = f"RPT-{engine_id}-{int(datetime.now(timezone.utc).timestamp())}"

        return ReportResponse(
            report_id=report_id,
            generated_at=datetime.now(timezone.utc),
            engine_id=engine.id,
            engine_name=engine.name,
            health_score=round(health_score, 1),
            health_status=health_status,
            total_operating_hours=engine.total_hours,
            active_faults_count=len(active_faults),
            faults_summary=faults_summary,
            telemetry_summary={
                "samples_analyzed": len(recent_telemetry),
                "avg_temperature": round(avg_temp, 1),
                "avg_oil_pressure": round(avg_oil, 1),
                "peak_rpm": round(max_rpm, 1)
            },
            recommendations=recommendations
        )

reports_service = ReportsService()
