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


def _severity(score: float) -> str:
    if score >= 0.75:
        return "high"
    if score >= 0.45:
        return "medium"
    return "low"


def detect_sensor_drift(telemetry: Any) -> dict:
    featured = engineer_features(clean_telemetry(telemetry_to_frame(telemetry)))
    if featured.empty:
        return {"detected": False, "sensor": None, "severity": None, "evidence": []}

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

    for sensor in WATCH_SENSORS:
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
        residual_col = f"{sensor}_residual"
        residual = abs(float(last[residual_col])) if residual_col in featured.columns else 0.0
        z_shift = mean_shift / (baseline_std + 1e-6)
        # Ignore normal mission variation; require a clear shift or twin residual.
        score = min(
            1.0,
            0.45 * max(0.0, z_shift - 2.5)
            + 0.40 * min(1.0, residual / 15.0)
            + 0.15 * max(0.0, abs(np.log(var_ratio)) - 1.2),
        )
        if score >= 0.55 and (z_shift >= 2.8 or residual >= 8.0):
            mode = "bias" if residual >= 8.0 and residual >= mean_shift else "drift"
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
