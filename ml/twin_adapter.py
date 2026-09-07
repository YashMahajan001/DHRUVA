"""Consume Digital Twin outputs when present. Do not recompute physics."""

from __future__ import annotations

from typing import Any, Mapping

import pandas as pd

RESIDUAL_KEYS = (
    "cht_residual",
    "egt_residual",
    "oil_pressure_residual",
    "fuel_flow_residual",
    "rpm_residual",
    "vibration_rms_residual",
)

# Digital Twin CSV raw residual column → canonical {sensor}_residual name.
TWIN_RAW_RESIDUALS = {
    "residual_rpm": "rpm_residual",
    "residual_cht": "cht_residual",
    "residual_egt": "egt_residual",
    "residual_oil_pressure": "oil_pressure_residual",
    "residual_oil_temp": "oil_pressure_residual",  # backup
    "residual_fuel_flow": "fuel_flow_residual",
    "residual_vibration_rms": "vibration_rms_residual",
    "residual_battery_voltage": "battery_voltage_residual",
    "residual_alternator_current": "alternator_current_residual",
}

# Sub-health components exposed by the Digital Twin CSV.
TWIN_SUB_HEALTH_KEYS = (
    "health_thermal",
    "health_lubrication",
    "health_mechanical",
    "health_combustion",
    "health_electrical",
    "health_sensor",
)


def extract_twin_residuals(row: Mapping[str, Any] | pd.Series) -> dict[str, float]:
    """Extract per-sensor residuals from a Digital Twin output row.

    Maps the Digital Twin raw residual column names (``residual_cht`` etc.)
    onto the canonical ML feature names (``cht_residual`` etc.).
    """
    source = dict(row) if not isinstance(row, dict) else row
    residuals: dict[str, float] = {}
    for twin_key, canonical in TWIN_RAW_RESIDUALS.items():
        if twin_key in source and source[twin_key] is not None:
            try:
                residuals[canonical] = float(source[twin_key])
            except (TypeError, ValueError):
                continue
    return residuals


def _jsonable(value: Any) -> Any:
    """Best-effort conversion of numpy values to Python-native JSON types."""
    import numpy as np

    if isinstance(value, np.generic):
        return value.item()
    if isinstance(value, np.ndarray):
        return [_jsonable(v) for v in value.tolist()]
    return value


def extract_twin_state(telemetry: Mapping[str, Any] | pd.Series | None) -> dict:
    """Return a JSON-serializable Digital Twin state summary.

    Handles both the nested ``digital_twin_state`` structure and the flat
    ``twin_cooling_o320.csv`` schema directly.
    """
    if telemetry is None:
        return {}
    row = dict(telemetry) if not isinstance(telemetry, dict) else telemetry
    nested = row.get("digital_twin_state") or row.get("twin_state") or {}
    if not isinstance(nested, dict):
        nested = {}

    state: dict[str, Any] = {}
    for key in (
        "health_index",
        "status",
        "health_state",
        "expected_state",
        "model_version",
        "uncertainty",
        "data_valid",
        "component_health",
    ):
        if key in nested:
            state[key] = _jsonable(nested[key])
        elif key in row and key in {"health_index", "status", "health_state"}:
            state[key] = _jsonable(row[key])

    # Flat twin CSV: expose validity and sub-health components.
    if "validity_ok" in row:
        state["validity_ok"] = _jsonable(row["validity_ok"])
    if "validity_flags" in row:
        state["validity_flags"] = _jsonable(row["validity_flags"])
    if "ml_fault_class" in row:
        value = _jsonable(row["ml_fault_class"])
        is_nan = isinstance(value, float) and value != value
        if not is_nan:
            state["ml_fault_class"] = value
    if "ml_confidence" in row:
        value = _jsonable(row["ml_confidence"])
        state["ml_confidence"] = value

    subhealth: dict[str, Any] = {}
    for key in TWIN_SUB_HEALTH_KEYS:
        if key in row and pd.notna(row[key]):
            subhealth[key] = _jsonable(row[key])
    if subhealth:
        state["component_health"] = subhealth

    residuals: dict[str, Any] = {}
    source = {**row, **nested}
    for key in RESIDUAL_KEYS:
        if key in source and source[key] is not None:
            residuals[key] = _jsonable(source[key])
    # Pull flat digital-twin residual columns into canonical feature names.
    residuals.update(extract_twin_residuals(source))
    if residuals:
        state["residuals"] = residuals
    return state