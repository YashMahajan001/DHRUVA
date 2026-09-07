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

# Prototype remaining-life scale used when no trained RUL model is available.
NOMINAL_LIFE_HOURS = 100.0
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

RESIDUAL_COLUMNS = [
    "cht_residual",
    "egt_residual",
    "oil_pressure_residual",
    "fuel_flow_residual",
    "rpm_residual",
    "vibration_rms_residual",
]

ANOMALY_FEATURE_COLUMNS = [
    "rpm",
    "throttle",
    "cht",
    "egt",
    "oil_pressure",
    "oil_temperature",
    "fuel_flow",
    "vibration_rms",
    "altitude",
    "ambient_temperature",
    "cht_rate_change",
    "egt_rate_change",
    "oil_pressure_rate_change",
    "vibration_rate_change",
    "rpm_throttle_mismatch",
    "fuel_efficiency",
    "oil_pressure_rpm_ratio",
    "cht_egt_residual",
    "physics_prediction_residual",
]

FAULT_FEATURE_COLUMNS = [
    "rpm",
    "cht",
    "egt",
    "oil_pressure",
    "oil_temperature",
    "fuel_flow",
    "vibration_rms",
    "throttle",
    "altitude",
    "cht_rate_change",
    "egt_rate_change",
    "oil_pressure_rate_change",
    "vibration_rate_change",
    "rpm_throttle_mismatch",
    "fuel_efficiency",
    "physics_prediction_residual",
]
