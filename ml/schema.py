"""Canonical telemetry fields used by the ML pipeline.

Aligns with the DHRUVA synthetic telemetry contract (v2 — 55-column CSV).
Aliases map Yash/schema variants onto one internal name so ML does not
invent a second schema.  The Digital Twin CSV has a separate schema
defined in ``TWIN_CSV_COLUMNS``.
"""

from __future__ import annotations

from typing import Mapping, Sequence

# ---------------------------------------------------------------------------
# Telemetry CSV canonical fields (55 columns)
# ---------------------------------------------------------------------------

CANONICAL_FIELDS: list[str] = [
    "timestamp",
    "engine_id",
    "model_id",
    "mission_id",
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
    "manifold_pressure",
    "coolant_temp",
    "fuel_pressure",
    "knock_index",
    "harmonic_freq",
    "vibration_kurtosis",
    "vibration_peak_hz",
    "compression_ratio",
    "valve_clearance",
    "radiator_airflow",
    "coolant_delta",
    "cht_cyl_1",
    "cht_cyl_2",
    "cht_cyl_3",
    "cht_cyl_4",
    "egt_cyl_1",
    "egt_cyl_2",
    "egt_cyl_3",
    "egt_cyl_4",
    "cyl_pressure_1",
    "cyl_pressure_2",
    "cyl_pressure_3",
    "cyl_pressure_4",
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

# Exact 55-column CSV header for schema validation.
TELEMETRY_CSV_COLUMNS: tuple[str, ...] = tuple(CANONICAL_FIELDS)

# ---------------------------------------------------------------------------
# Column aliases  (CSV header variant → canonical name)
# ---------------------------------------------------------------------------

COLUMN_ALIASES: Mapping[str, str] = {
    "ambient_temp": "ambient_temperature",
    "ambientTemperature": "ambient_temperature",
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
    "manifoldPressure": "manifold_pressure",
    "coolantTemp": "coolant_temp",
    "fuelPressure": "fuel_pressure",
    "knockIndex": "knock_index",
    "harmonicFreq": "harmonic_freq",
    "vibrationKurtosis": "vibration_kurtosis",
    "vibrationPeakHz": "vibration_peak_hz",
    "compressionRatio": "compression_ratio",
    "valveClearance": "valve_clearance",
    "radiatorAirflow": "radiator_airflow",
    "coolantDelta": "coolant_delta",
    "missionPhase": "mission_phase",
    "fault": "fault_label",
    "fault_type": "fault_label",
    "faultLabel": "fault_label",
    "faultActive": "fault_active",
    "faultSeverity": "fault_severity",
    "dataQuality": "data_quality",
    "sensorStatus": "sensor_status",
    "simulationSeed": "simulation_seed",
    "health": "health_index",
    "healthIndex": "health_index",
    "RUL": "rul",
    "remaining_useful_life": "rul",
    "engineId": "engine_id",
    "modelId": "model_id",
    "missionId": "mission_id",
    "time": "timestamp",
    "ts": "timestamp",
}

TWIN_RESIDUAL_ALIASES: Mapping[str, str] = {
    "residual_cht": "cht_residual",
    "residual_egt": "egt_residual",
    "residual_oil_pressure": "oil_pressure_residual",
    "residual_fuel_flow": "fuel_flow_residual",
    "residual_rpm": "rpm_residual",
    "residual_vibration_rms": "vibration_rms_residual",
    "residual_vibration": "vibration_rms_residual",
    "cht_expected_residual": "cht_residual",
    "egt_expected_residual": "egt_residual",
}

# ---------------------------------------------------------------------------
# Digital Twin CSV schema (separate from telemetry)
# ---------------------------------------------------------------------------

TWIN_CSV_COLUMNS: tuple[str, ...] = (
    "timestamp",
    "engine_id",
    "model_id",
    "mission_id",
    "mission_phase",
    "throttle",
    "altitude",
    "ambient_temp",
    "health_index",
    "health_state",
    "validity_ok",
    "validity_flags",
    "ml_fault_class",
    "ml_confidence",
    "health_thermal",
    "health_lubrication",
    "health_mechanical",
    "health_combustion",
    "health_electrical",
    "health_sensor",
    "expected_rpm",
    "actual_rpm",
    "residual_rpm",
    "norm_residual_rpm",
    "expected_cht",
    "actual_cht",
    "residual_cht",
    "norm_residual_cht",
    "expected_egt",
    "actual_egt",
    "residual_egt",
    "norm_residual_egt",
    "expected_oil_pressure",
    "actual_oil_pressure",
    "residual_oil_pressure",
    "norm_residual_oil_pressure",
    "expected_oil_temp",
    "actual_oil_temp",
    "residual_oil_temp",
    "norm_residual_oil_temp",
    "expected_fuel_flow",
    "actual_fuel_flow",
    "residual_fuel_flow",
    "norm_residual_fuel_flow",
    "expected_vibration_rms",
    "actual_vibration_rms",
    "residual_vibration_rms",
    "norm_residual_vibration_rms",
    "expected_battery_voltage",
    "actual_battery_voltage",
    "residual_battery_voltage",
    "norm_residual_battery_voltage",
    "expected_alternator_current",
    "actual_alternator_current",
    "residual_alternator_current",
    "norm_residual_alternator_current",
)

# Columns that identify a row but must NOT be used as numeric ML features.
METADATA_COLUMNS: frozenset[str] = frozenset({
    "timestamp",
    "engine_id",
    "model_id",
    "mission_id",
    "simulation_seed",
    "data_quality",
    "validity_flags",
})

# Categorical columns that should be one-hot encoded, not treated as numeric.
CATEGORICAL_COLUMNS: frozenset[str] = frozenset({
    "mission_phase",
    "fault_label",
    "sensor_status",
    "health_state",
})

# ---------------------------------------------------------------------------
# Numeric range guards (used by cleaning for clipping / outlier flags)
# ---------------------------------------------------------------------------

TELEMETRY_RANGES: Mapping[str, tuple[float, float]] = {
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
    "manifold_pressure": (0.0, 200.0),
    "coolant_temp": (-20.0, 150.0),
    "fuel_pressure": (0.0, 100.0),
    "knock_index": (0.0, 10.0),
    "harmonic_freq": (0.0, 5000.0),
    "vibration_kurtosis": (0.0, 20.0),
    "vibration_peak_hz": (0.0, 5000.0),
    "compression_ratio": (5.0, 20.0),
    "valve_clearance": (0.0, 1.0),
    "radiator_airflow": (0.0, 100.0),
    "coolant_delta": (-30.0, 60.0),
    "health_index": (0.0, 100.0),
    "rul": (0.0, 500.0),
    "fault_severity": (0.0, 10.0),
    "cht_residual": (-50.0, 100.0),
    "egt_residual": (-100.0, 200.0),
    "oil_pressure_residual": (-30.0, 50.0),
    "fuel_flow_residual": (-10.0, 30.0),
    "rpm_residual": (-500.0, 1000.0),
    "vibration_rms_residual": (-10.0, 30.0),
}
