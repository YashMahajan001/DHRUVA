"""Canonical telemetry schema for synthetic engine records."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


TELEMETRY_COLUMNS: list[str] = [
    "timestamp",
    "engine_id",
    "model_id",
    "mission_id",
    "altitude",
    "ambient_temp",
    "rpm",
    "throttle",
    "cht",
    "egt",
    "oil_pressure",
    "oil_temp",
    "fuel_flow",
    "vibration_rms",
    "battery_voltage",
    "alternator_current",
    "injection_timing",
    "mission_phase",
    "fault_label",
    "fault_active",
    "fault_severity",
    "data_quality",
    "sensor_status",
    "simulation_seed",
    "health_index",
    "rul",
    "cht_residual",
    "egt_residual",
    "oil_pressure_residual",
    "fuel_flow_residual",
    "rpm_residual",
    "vibration_rms_residual",
]


class TelemetryRecord(BaseModel):
    """One sampled telemetry row.

    Field units are representative and synthetic:
    altitude (m), ambient_temp/cht/egt/oil_temp (°C), rpm (1/min),
    throttle (0-1), oil_pressure (psi-equivalent), fuel_flow (L/h-equivalent),
    vibration_rms (g-equivalent), battery_voltage (V), alternator_current (A),
    injection_timing (deg BTDC-equivalent).
    """

    timestamp: datetime
    engine_id: str
    model_id: str
    mission_id: str
    altitude: float
    ambient_temp: float
    rpm: float
    throttle: float = Field(ge=0.0, le=1.2)
    cht: float
    egt: float
    oil_pressure: float
    oil_temp: float
    fuel_flow: float
    vibration_rms: float
    battery_voltage: float
    alternator_current: float
    injection_timing: float
    mission_phase: str
    fault_label: str = "HEALTHY"
    fault_active: bool = False
    fault_severity: float = 0.0
    data_quality: float = 1.0
    sensor_status: str = "OK"
    simulation_seed: int = 0
    health_index: float = Field(ge=0.0, le=100.0)
    rul: float = Field(ge=0.0)
    cht_residual: Optional[float] = None
    egt_residual: Optional[float] = None
    oil_pressure_residual: Optional[float] = None
    fuel_flow_residual: Optional[float] = None
    rpm_residual: Optional[float] = None
    vibration_rms_residual: Optional[float] = None

    model_config = {"extra": "forbid"}
