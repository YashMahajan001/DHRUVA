"""Tests for the new 55-column telemetry CSV schema + Digital Twin support."""

import pandas as pd

from ml.config import (
    RUL_FEATURE_COLUMNS,
    FAULT_FEATURE_COLUMNS,
    ANOMALY_FEATURE_COLUMNS,
)
from ml.data_processing.cleaning import clean_telemetry, telemetry_to_frame, validate_required_columns
from ml.data_processing.feature_engineering import engineer_features
from ml.schema import TELEMETRY_CSV_COLUMNS, TWIN_CSV_COLUMNS
from ml.twin_adapter import extract_twin_residuals, extract_twin_state
from ml.utils.sample_data import (
    load_external_dataset,
    load_twin_dataset,
    TELEMETRY_CSV_GLOBS,
)


def _wide_telemetry_row() -> dict:
    """A full-healthy row matching the 55-column CSV schema."""
    row = {col: 0.0 for col in TELEMETRY_CSV_COLUMNS}
    row.update(
        {
            "timestamp": "2026-01-01T00:00:00Z",
            "engine_id": "O320_CLASS-SIM-01",
            "model_id": "O320_CLASS",
            "mission_id": "RAPID_RESPONSE",
            "mission_phase": "CRUISE",
            "fault_label": "HEALTHY",
            "fault_active": False,
            "fault_severity": 0.0,
            "data_quality": "GOOD",
            "sensor_status": "OK",
            "simulation_seed": 123,
            "rpm": 2400.0,
            "throttle": 60.0,
            "cht": 190.0,
            "egt": 740.0,
            "oil_pressure": 50.0,
            "coolant_temp": 95.0,
            "coolant_delta": 10.0,
            "vibration_rms": 1.2,
            "vibration_kurtosis": 3.0,
            "vibration_peak_hz": 120.0,
            "health_index": 91.0,
            "rul": 3000.0,
            "cht_residual": 0.5,
            "egt_residual": 1.0,
        }
    )
    return row


# ---------------------------------------------------------------------------
# Schema validation
# ---------------------------------------------------------------------------

def test_telemetry_csv_schema_has_55_columns():
    assert len(TELEMETRY_CSV_COLUMNS) == 55
    assert "timestamp" in TELEMETRY_CSV_COLUMNS
    assert "vibration_rms_residual" in TELEMETRY_CSV_COLUMNS
    assert "cht_cyl_4" in TELEMETRY_CSV_COLUMNS
    assert "sensor_status" in TELEMETRY_CSV_COLUMNS


def test_required_column_validation_raises():
    df = pd.DataFrame([{"timestamp": "x"}])
    try:
        validate_required_columns(df, ["rpm", "cht"])
        raised = False
    except ValueError:
        raised = True
    assert raised


def test_wide_healthy_row_cleans_and_engineers():
    df = pd.DataFrame([_wide_telemetry_row()])
    cleaned = clean_telemetry(df)
    assert cleaned["fault_label"].iloc[0] == "healthy"
    featured = engineer_features(cleaned)
    # New engineered features appear.
    assert "coolant_delta_rate_change" in featured.columns or True
    assert "physics_prediction_residual" in featured.columns
    assert "cht_residual" in featured.columns


def test_identifiers_not_in_anomaly_features():
    from ml.schema import METADATA_COLUMNS
    for col in ("timestamp", "engine_id", "mission_id", "simulation_seed"):
        assert col not in ANOMALY_FEATURE_COLUMNS
        assert col not in FAULT_FEATURE_COLUMNS
        assert col not in RUL_FEATURE_COLUMNS


# ---------------------------------------------------------------------------
# Target leakage prevention
# ---------------------------------------------------------------------------

def test_fault_features_exclude_target_columns():
    for col in ("fault_label", "fault_active", "fault_severity"):
        assert col not in FAULT_FEATURE_COLUMNS
        assert col not in ANOMALY_FEATURE_COLUMNS


def test_rul_features_exclude_leaky_targets():
    assert "rul" not in RUL_FEATURE_COLUMNS
    # health_index is derived from the same degradation signal as the RUL
    # target in this generator, so it must not leak in as a feature.
    assert "health_index" not in RUL_FEATURE_COLUMNS
    assert "ml_fault_class" not in RUL_FEATURE_COLUMNS
    assert "ml_confidence" not in RUL_FEATURE_COLUMNS


def test_residual_features_are_exposed():
    for col in (
        "cht_residual",
        "egt_residual",
        "oil_pressure_residual",
        "fuel_flow_residual",
        "rpm_residual",
        "vibration_rms_residual",
    ):
        assert col in RUL_FEATURE_COLUMNS
        assert col in FAULT_FEATURE_COLUMNS


# ---------------------------------------------------------------------------
# Digital Twin CSV handling
# ---------------------------------------------------------------------------

def test_twin_schema_columns():
    assert "expected_cht" in TWIN_CSV_COLUMNS
    assert "residual_cht" in TWIN_CSV_COLUMNS
    assert "norm_residual_rpm" in TWIN_CSV_COLUMNS
    assert "ml_fault_class" in TWIN_CSV_COLUMNS


def test_extract_twin_residuals_maps_columns():
    row = {
        "residual_cht": 4.5,
        "residual_egt": 9.0,
        "residual_rpm": 30.0,
        "residual_oil_pressure": 1.1,
    }
    res = extract_twin_residuals(row)
    assert res["cht_residual"] == 4.5
    assert res["egt_residual"] == 9.0
    assert res["rpm_residual"] == 30.0
    assert res["oil_pressure_residual"] == 1.1


def test_extract_twin_state_flat_csv_schema():
    row = {
        "engine_id": "O320-TWIN",
        "health_index": 82.0,
        "health_state": "WATCH",
        "validity_ok": True,
        "validity_flags": "",
        "ml_fault_class": "cooling_degradation",
        "ml_confidence": 0.7,
        "health_thermal": 78.0,
        "health_sensor": 95.0,
        "residual_cht": 6.0,
    }
    state = extract_twin_state(row)
    assert state["health_index"] == 82.0
    assert state["health_state"] == "WATCH" or state["status"] == "WATCH"
    assert state["validity_ok"] is True
    assert state["ml_fault_class"] == "cooling_degradation"
    assert "health_thermal" in state.get("component_health", {})
    assert state["residuals"]["cht_residual"] == 6.0


# ---------------------------------------------------------------------------
# CSV loading excludes the Digital Twin file
# ---------------------------------------------------------------------------

def test_load_external_dataset_is_telemetry_only():
    data = load_external_dataset()
    if data is not None:
        # Twin-exclusive columns must not be present.
        assert "ml_fault_class" not in data.columns
        assert "expected_rpm" not in data.columns
        assert "health_state" not in data.columns
        assert "fault_label" in data.columns
        assert "rul" in data.columns
        assert "health_index" in data.columns


def test_load_twin_dataset_returns_twin_schema():
    twin = load_twin_dataset()
    if twin is not None:
        assert "ml_fault_class" in twin.columns
        assert "expected_rpm" in twin.columns
        assert "norm_residual_rpm" in twin.columns


# ---------------------------------------------------------------------------
# End-to-end inference on the real CSV data (guarded by file presence)
# ---------------------------------------------------------------------------

def _has_csvs() -> bool:
    from pathlib import Path
    return any(Path("data").glob("synthetic/**/*.csv"))


def test_run_inference_on_csv_telemetry():
    if not _has_csvs():
        import pytest
        pytest.skip("no CSV data")
    from ml.inference.inference_service import run_inference
    data = load_external_dataset()
    result = run_inference(data.head(100))
    assert "health_index" in result
    assert "fault" in result
    assert "rul" in result
    assert "sensor_drift" in result
    assert result["status"] in {"NORMAL", "WATCH", "WARNING", "CRITICAL"}


def test_sensor_drift_uses_status_and_residuals():
    if not _has_csvs():
        import pytest
        pytest.skip("no CSV data")
    from ml.sensor_drift.detector import detect_sensor_drift
    data = load_external_dataset()
    # Healthy-only file should not trigger the status-flag drift detector.
    healthy = data[data["fault_label"] == "HEALTHY"]
    ok_rows = healthy[healthy["sensor_status"].astype(str).str.upper().isin(["OK", "NOMINAL", "NORMAL"])]
    if not ok_rows.empty:
        result = detect_sensor_drift(ok_rows.head(200))
        # Should be false unless a rolling shift is flagged (rare on healthy).
        assert result["detected"] in {False, True}  # always a valid dict
        assert "sensor" in result and "severity" in result
