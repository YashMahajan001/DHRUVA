"""Sensor drift / bias / dropout detection using rolling stats and twin residuals."""

from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd

from ml.config import ROLLING_WINDOW
from ml.data_processing.cleaning import clean_telemetry, telemetry_to_frame
from ml.data_processing.feature_engineering import engineer_features

WATCH_SENSORS = [
    "cht",
    "egt",
    "oil_pressure",
    "oil_temperature",
    "fuel_flow",
    "vibration_rms",
    "rpm",
    "battery_voltage",
]

# Additional sensors available in the new 55-column CSV.
WATCH_SENSORS_EXTENDED = [
    *WATCH_SENSORS,
    "coolant_temp",
    "manifold_pressure",
    "vibration_kurtosis",
    "alternator_current",
]

# Sensors that carry a corresponding twin residual in the new schema.
SENSORS_WITH_RESIDUAL = [
    "cht",
    "egt",
    "oil_pressure",
    "fuel_flow",
    "rpm",
    "vibration_rms",
]

# Residual scale used to normalise raw deviation into the [0,1] score band.
_RESIDUAL_SCALE = {
    "cht": 15.0,
    "egt": 25.0,
    "oil_pressure": 8.0,
    "fuel_flow": 5.0,
    "rpm": 150.0,
    "vibration_rms": 3.0,
}


def _severity(score: float) -> str:
    if score >= 0.75:
        return "high"
    if score >= 0.45:
        return "medium"
    return "low"


def _residual_magnitude(featured: pd.DataFrame, sensor: str) -> float:
    residual_col = f"{sensor}_residual"
    if residual_col not in featured.columns:
        return 0.0
    scale = _RESIDUAL_SCALE.get(sensor, 15.0)
    raw = pd.to_numeric(featured[residual_col], errors="coerce").tail(ROLLING_WINDOW).fillna(0.0)
    # Small residuals are normal; scale into a bounded magnitude.
    return float(min(1.0, abs(raw.mean()) / scale))


def detect_sensor_drift(telemetry: Any) -> dict:
    """Detect sensor drift/bias/dropout from telemetry + residual features.

    Uses ``sensor_status`` (if present), rolling statistics, cross-sensor
    consistency, and the Digital Twin residuals — without using the fault
    label as an input.
    """
    featured = engineer_features(clean_telemetry(telemetry_to_frame(telemetry)))
    if featured.empty:
        return {"detected": False, "sensor": None, "severity": None, "evidence": []}

    # 1) Direct sensor_status flag if the CSV provides it.
    if "sensor_status" in featured.columns:
        status = str(featured["sensor_status"].iloc[-1]).strip().upper()
        if status and status not in {"OK", "NOMINAL", "NORMAL"}:
            return {
                "detected": True,
                "sensor": "sensor_status",
                "severity": "high",
                "mode": "status_flag",
                "evidence": [f"sensor_status={status}"],
            }

    last = featured.iloc[-1]
    candidates: list[tuple[str, float, str]] = []

    dropout_count = float(last.get("missing_sensor_count") or 0.0)
    if dropout_count >= 1:
        return {
            "detected": True,
            "sensor": "cht",
            "severity": "high",
            "mode": "dropout",
            "evidence": ["missing_sensor_count"],
        }

    watch = WATCH_SENSORS_EXTENDED
    for sensor in watch:
        if sensor not in featured.columns:
            continue
        series = pd.to_numeric(featured[sensor], errors="coerce")
        window = series.tail(max(ROLLING_WINDOW, 8))
        baseline = series.head(max(len(series) // 3, 5))
        if window.empty or baseline.empty:
            continue
        mean_shift = abs(float(window.mean() - baseline.mean()))
        baseline_std = float(baseline.std() or 1.0)
        var_ratio = float((window.var() + 1e-6) / (baseline.var() + 1e-6))
        residual_mag = _residual_magnitude(featured, sensor)
        z_shift = mean_shift / (baseline_std + 1e-6)
        # Ignore normal mission variation; require a clear shift or twin residual.
        score = min(
            1.0,
            0.45 * max(0.0, z_shift - 2.5)
            + 0.40 * residual_mag
            + 0.15 * max(0.0, abs(np.log(var_ratio)) - 1.2),
        )
        threshold = 0.55
        trigger = z_shift >= 2.8 or residual_mag >= 0.55
        if score >= threshold and trigger:
            residual_scale = _RESIDUAL_SCALE.get(sensor, 15.0)
            residual_abs = residual_mag * residual_scale
            mode = "bias" if residual_abs >= 0.8 * residual_scale and residual_abs >= mean_shift else "drift"
            candidates.append((sensor, score, mode))

    if not candidates:
        return {"detected": False, "sensor": None, "severity": None, "evidence": []}

    sensor, score, mode = max(candidates, key=lambda item: item[1])
    return {
        "detected": True,
        "sensor": sensor,
        "severity": _severity(score),
        "mode": mode,
        "score": round(score, 4),
        "evidence": [f"{sensor} {mode}"],
    }