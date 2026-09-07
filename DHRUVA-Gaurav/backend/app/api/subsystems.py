from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from backend.app.database.session import get_db
from backend.app.models.telemetry import Telemetry
from backend.app.models.twin_state import TwinState
from backend.app.models.engine import Engine

router = APIRouter(prefix="/subsystems", tags=["Subsystems"])


class SubsystemStatus(BaseModel):
    """Health status for a single engine subsystem."""
    name: str = Field(..., examples=["cylinder"])
    status: str = Field(..., examples=["NOMINAL"])  # NOMINAL, WARNING, DEGRADED, CRITICAL
    health_score: float = Field(..., ge=0.0, le=100.0, examples=[92.5])
    details: Optional[Dict[str, Any]] = None


class SubsystemsResponse(BaseModel):
    """Aggregated subsystem health for one or all engines."""
    engine_id: Optional[str] = None
    timestamp: datetime
    subsystems: List[SubsystemStatus]


def _evaluate_subsystems(telemetry: Telemetry, engine: Engine) -> List[SubsystemStatus]:
    """Derive subsystem health from the latest telemetry readings."""
    max_temp = 240.0
    max_rpm = 2700
    if engine and engine.engine_model:
        max_temp = engine.engine_model.max_temperature
        max_rpm = engine.engine_model.max_rpm

    subsystems = []

    # Cylinder health — driven by CHT / temperature
    temp_ratio = telemetry.temperature / max_temp if max_temp > 0 else 0
    if temp_ratio > 1.0:
        cyl_status, cyl_score = "CRITICAL", max(5.0, 100.0 - (temp_ratio - 1.0) * 500)
    elif temp_ratio > 0.90:
        cyl_status, cyl_score = "WARNING", max(50.0, 100.0 - (temp_ratio - 0.90) * 500)
    else:
        cyl_status, cyl_score = "NOMINAL", min(100.0, 100.0 - (temp_ratio * 15))
    subsystems.append(SubsystemStatus(
        name="cylinder",
        status=cyl_status,
        health_score=round(cyl_score, 1),
        details={"temperature": telemetry.temperature, "max_temperature": max_temp},
    ))

    # Cooling / Lubrication — driven by oil pressure (normal 30-65 psi)
    if telemetry.oil_pressure < 20.0:
        cool_status, cool_score = "CRITICAL", max(10.0, telemetry.oil_pressure * 2.5)
    elif telemetry.oil_pressure < 30.0:
        cool_status, cool_score = "WARNING", max(50.0, 50.0 + (telemetry.oil_pressure - 20.0) * 5)
    else:
        cool_status, cool_score = "NOMINAL", min(100.0, 80.0 + telemetry.oil_pressure * 0.3)
    subsystems.append(SubsystemStatus(
        name="cooling",
        status=cool_status,
        health_score=round(cool_score, 1),
        details={"oil_pressure": telemetry.oil_pressure},
    ))

    # Lubrication — same data source as cooling, slightly different thresholds
    if telemetry.oil_pressure < 15.0:
        lub_status, lub_score = "CRITICAL", max(5.0, telemetry.oil_pressure * 2)
    elif telemetry.oil_pressure < 25.0:
        lub_status, lub_score = "WARNING", max(40.0, 40.0 + (telemetry.oil_pressure - 15.0) * 6)
    else:
        lub_status, lub_score = "NOMINAL", min(100.0, 85.0 + telemetry.oil_pressure * 0.2)
    subsystems.append(SubsystemStatus(
        name="lubrication",
        status=lub_status,
        health_score=round(lub_score, 1),
        details={"oil_pressure": telemetry.oil_pressure},
    ))

    # Fuel system — driven by fuel_flow and throttle correlation
    expected_fuel = telemetry.throttle * 0.3  # rough linear model
    fuel_deviation = abs(telemetry.fuel_flow - expected_fuel)
    if fuel_deviation > 15.0:
        fuel_status, fuel_score = "CRITICAL", max(20.0, 100.0 - fuel_deviation * 3)
    elif fuel_deviation > 8.0:
        fuel_status, fuel_score = "WARNING", max(55.0, 100.0 - fuel_deviation * 3)
    else:
        fuel_status, fuel_score = "NOMINAL", min(100.0, 95.0 - fuel_deviation)
    subsystems.append(SubsystemStatus(
        name="fuel",
        status=fuel_status,
        health_score=round(fuel_score, 1),
        details={"fuel_flow": telemetry.fuel_flow, "throttle": telemetry.throttle},
    ))

    # Electrical — RPM stability as proxy (overspeed = electrical governor issue)
    rpm_ratio = telemetry.rpm / max_rpm if max_rpm > 0 else 0
    if rpm_ratio > 1.05:
        elec_status, elec_score = "CRITICAL", max(15.0, 100.0 - (rpm_ratio - 1.0) * 600)
    elif rpm_ratio > 0.95:
        elec_status, elec_score = "NOMINAL", min(100.0, 100.0 - (rpm_ratio - 0.80) * 30)
    else:
        elec_status, elec_score = "NOMINAL", min(100.0, 95.0)
    subsystems.append(SubsystemStatus(
        name="electrical",
        status=elec_status,
        health_score=round(elec_score, 1),
        details={"rpm": telemetry.rpm, "max_rpm": max_rpm},
    ))

    return subsystems


@router.get("", response_model=List[SubsystemsResponse])
def get_subsystems(
    engine_id: Optional[str] = Query(default=None, description="Filter by engine ID"),
    db: Session = Depends(get_db),
):
    """
    List subsystem health states (cylinder, cooling, lubrication, fuel, electrical).
    Derives health from latest telemetry data per engine.
    """
    if engine_id:
        engines = db.query(Engine).filter(Engine.id == engine_id).all()
    else:
        engines = db.query(Engine).all()

    results = []
    for eng in engines:
        latest_telemetry = (
            db.query(Telemetry)
            .filter(Telemetry.engine_id == eng.id)
            .order_by(Telemetry.timestamp.desc())
            .first()
        )
        if not latest_telemetry:
            # Return default nominal state if no telemetry exists yet
            results.append(SubsystemsResponse(
                engine_id=eng.id,
                timestamp=datetime.now(timezone.utc),
                subsystems=[
                    SubsystemStatus(name=name, status="NOMINAL", health_score=100.0)
                    for name in ["cylinder", "cooling", "lubrication", "fuel", "electrical"]
                ],
            ))
            continue

        subsystems = _evaluate_subsystems(latest_telemetry, eng)
        results.append(SubsystemsResponse(
            engine_id=eng.id,
            timestamp=latest_telemetry.timestamp,
            subsystems=subsystems,
        ))

    return results
