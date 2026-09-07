"""Canonical telemetry fields used by the ML pipeline.

Aligns with the DHRUVA synthetic telemetry contract. Aliases map Yash/schema
variants onto one internal name so ML does not invent a second schema.
"""

from __future__ import annotations

from typing import Mapping

CANONICAL_FIELDS = [
    "timestamp",
    "engine_id",
    "model_id",
    "altitude",
    "ambient_temperature",
    "rpm",
    "throttle",
    "cht",
    "egt",
    "oil_pressure",
    "oil_temperature",
    "fuel_flow",
    "vibration_rms",
    "battery_voltage",
    "alternator_current",
    "injection_timing",
    "mission_phase",
    "fault_label",
    "health_index",
    "rul",
]

COLUMN_ALIASES: Mapping[str, str] = {
    "ambient_temp": "ambient_temperature",
    "ambientTemperature": "ambient_temperature",
    "temperature": "cht",
    "temp": "cht",
    "CHT": "cht",
    "EGT": "egt",

    "oil_temp": "oil_temperature",
    "oilTemp": "oil_temperature",
    "oilPressure": "oil_pressure",
    "fuelFlow": "fuel_flow",
    "vibration": "vibration_rms",
    "vibrationRms": "vibration_rms",
    "batteryVoltage": "battery_voltage",
    "alternatorCurrent": "alternator_current",
    "injectionTiming": "injection_timing",
    "missionPhase": "mission_phase",
    "fault": "fault_label",
    "fault_type": "fault_label",
    "health": "health_index",
    "healthIndex": "health_index",
    "RUL": "rul",
    "remaining_useful_life": "rul",
    "engineId": "engine_id",
    "modelId": "model_id",
    "time": "timestamp",
    "ts": "timestamp",
}

TWIN_RESIDUAL_ALIASES: Mapping[str, str] = {
    "residual_cht": "cht_residual",
    "residual_egt": "egt_residual",
    "residual_oil_pressure": "oil_pressure_residual",
    "residual_fuel_flow": "fuel_flow_residual",
    "residual_rpm": "rpm_residual",
    "residual_vibration": "vibration_rms_residual",
    "cht_expected_residual": "cht_residual",
    "egt_expected_residual": "egt_residual",
}

TELEMETRY_RANGES = {
    "altitude": (-50.0, 15000.0),
    "ambient_temperature": (-60.0, 70.0),
    "rpm": (0.0, 9000.0),
    "throttle": (0.0, 100.0),
    "cht": (0.0, 350.0),
    "egt": (0.0, 1200.0),
    "oil_pressure": (0.0, 150.0),
    "oil_temperature": (0.0, 200.0),
    "fuel_flow": (0.0, 80.0),
    "vibration_rms": (0.0, 50.0),
    "battery_voltage": (0.0, 32.0),
    "alternator_current": (-20.0, 80.0),
    "injection_timing": (-30.0, 60.0),
    "health_index": (0.0, 100.0),
    "rul": (0.0, 500.0),
}
