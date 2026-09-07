"""Prototype ML configuration. Thresholds are demo-only, not operational limits."""

from __future__ import annotations

from pathlib import Path

PACKAGE_ROOT = Path(__file__).resolve().parent
ARTIFACTS_DIR = PACKAGE_ROOT / "artifacts"
PREPROCESSOR_PATH = ARTIFACTS_DIR / "preprocessor.joblib"
ANOMALY_MODEL_PATH = ARTIFACTS_DIR / "anomaly_isolation_forest.joblib"
FAULT_MODEL_PATH = ARTIFACTS_DIR / "fault_classifier.joblib"
RUL_MODEL_PATH = ARTIFACTS_DIR / "rul_model.joblib"
TREND_MODEL_PATH = ARTIFACTS_DIR / "trend_forecaster.joblib"

RANDOM_STATE = 42
ROLLING_WINDOW = 8
MIN_ROLLING_PERIODS = 3

# Prototype remaining-life scale used when no trained RUL model is available,
# and the ceiling for RUL predictions.  The synthetic CSV data saturates RUL
# at 3600 hours for healthy engines, so we align with that scale.
NOMINAL_LIFE_HOURS = 3600.0
RUL_UNCERTAINTY_FLOOR_HOURS = 3.0
RUL_UNCERTAINTY_CEILING_HOURS = 12.0

# Prototype / demo health bands — not certified aircraft operating limits.
HEALTH_NORMAL_MIN = 90.0
HEALTH_WATCH_MIN = 70.0
HEALTH_WARNING_MIN = 40.0

HEALTH_WEIGHTS = {
    "physics_residual": 0.20,
    "anomaly_probability": 0.30,
    "degradation_estimate": 0.30,
    "safety_rules": 0.20,
}

HEALTHY_FAULT_LABELS = {
    "",
    "none",
    "healthy",
    "normal",
    "no_fault",
    "ok",
}

# Fault classes this branch can synthesise for fixtures / demos.
# The classifier derives its real label set from the training data at runtime;
# this list is only used by the in-memory fixture generator.
FAULT_CLASSES = [
    "healthy",
    "cooling_degradation",
    "overheating",
    "injector_degradation",
    "misfire",
    "lubrication_loss",
    "abnormal_vibration",
    "alternator_degradation",
    "sensor_bias",
    "sensor_drift",
    "sensor_dropout",
]

# ---------------------------------------------------------------------------
# Feature groups  (usable raw + engineered columns by subsystem)
# ---------------------------------------------------------------------------

ENGINE_FEATURES = [
    "rpm",
    "throttle",
    "manifold_pressure",
    "injection_timing",
    "fuel_flow",
    "fuel_pressure",
]

THERMAL_FEATURES = [
    "cht",
    "egt",
    "coolant_temp",
    "coolant_delta",
    "oil_temperature",
    "radiator_airflow",
    "cht_cyl_1",
    "cht_cyl_2",
    "cht_cyl_3",
    "cht_cyl_4",
    "egt_cyl_1",
    "egt_cyl_2",
    "egt_cyl_3",
    "egt_cyl_4",
]

MECHANICAL_FEATURES = [
    "vibration_rms",
    "vibration_kurtosis",
    "vibration_peak_hz",
    "harmonic_freq",
    "knock_index",
    "valve_clearance",
    "compression_ratio",
    "cyl_pressure_1",
    "cyl_pressure_2",
    "cyl_pressure_3",
    "cyl_pressure_4",
]

ELECTRICAL_FEATURES = [
    "battery_voltage",
    "alternator_current",
]

MISSION_FEATURES = [
    "altitude",
    "ambient_temperature",
    "throttle",
]

RESIDUAL_FEATURES = [
    "cht_residual",
    "egt_residual",
    "oil_pressure_residual",
    "fuel_flow_residual",
    "rpm_residual",
    "vibration_rms_residual",
]

# ---------------------------------------------------------------------------
# Legacy compatibility lists  (used when new CSV columns are unavailable)
# ---------------------------------------------------------------------------

SENSOR_COLUMNS = [
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
]

RESIDUAL_COLUMNS = list(RESIDUAL_FEATURES)

# Base columns for every model before engineered features are added.
BASE_ML_COLUMNS = [
    *ENGINE_FEATURES,
    *THERMAL_FEATURES,
    *MECHANICAL_FEATURES,
    *ELECTRICAL_FEATURES,
    *MISSION_FEATURES,
]

# ---------------------------------------------------------------------------
# Per-model feature column lists
# ---------------------------------------------------------------------------

# Anomaly detection: raw + engineered features, incl. residuals.
ANOMALY_FEATURE_COLUMNS = [
    *BASE_ML_COLUMNS,
    *RESIDUAL_FEATURES,
    "cht_rate_change",
    "egt_rate_change",
    "oil_pressure_rate_change",
    "vibration_rate_change",
    "rpm_rate_change",
    "rpm_throttle_mismatch",
    "fuel_efficiency",
    "oil_pressure_rpm_ratio",
    "cht_egt_residual",
    "physics_prediction_residual",
    "cht_ambient_delta",
    "egt_throttle_ratio",
    "vibration_rpm_ratio",
    "load_response",
    "temperature_response",
]

# Fault classification: similar set but no label or twin-health columns.
FAULT_FEATURE_COLUMNS = [
    *BASE_ML_COLUMNS,
    *RESIDUAL_FEATURES,
    "cht_rate_change",
    "egt_rate_change",
    "oil_pressure_rate_change",
    "vibration_rate_change",
    "rpm_rate_change",
    "rpm_throttle_mismatch",
    "fuel_efficiency",
    "oil_pressure_rpm_ratio",
    "cht_egt_residual",
    "physics_prediction_residual",
    "cht_ambient_delta",
    "egt_throttle_ratio",
    "vibration_rpm_ratio",
    "load_response",
    "temperature_response",
]

# RUL: features that express degradation but exclude `rul`/`health_index`
# (health_index is derived from the same degradation signal in this generator,
#  so using it as a feature would leak the RUL target).
RUL_FEATURE_COLUMNS = [
    *BASE_ML_COLUMNS,
    *RESIDUAL_FEATURES,
    "cht_rate_change",
    "egt_rate_change",
    "oil_pressure_rate_change",
    "vibration_rate_change",
    "rpm_rate_change",
    "rpm_throttle_mismatch",
    "fuel_efficiency",
    "oil_pressure_rpm_ratio",
    "cht_egt_residual",
    "physics_prediction_residual",
    "cht_ambient_delta",
    "egt_throttle_ratio",
    "vibration_rpm_ratio",
    "load_response",
    "temperature_response",
]