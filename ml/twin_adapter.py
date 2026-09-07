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


def extract_twin_state(telemetry: Mapping[str, Any] | pd.Series | None) -> dict:
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
        if key in nested and not pd.isna(nested[key]):
            state[key] = nested[key]
        elif key in row and key in {"health_index", "status", "health_state"} and not pd.isna(row[key]):
            if key == "health_index" and float(row[key] or 0) <= 0:
                continue
            state[key] = row[key]



    residuals = {}
    source = {**row, **nested}
    for key in RESIDUAL_KEYS:
        if key in source and source[key] is not None:
            residuals[key] = source[key]
    if residuals:
        state["residuals"] = residuals
    return state
