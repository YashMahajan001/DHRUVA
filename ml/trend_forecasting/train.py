"""Lightweight linear trend forecasts for MVP health/telemetry series."""

from __future__ import annotations

from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from ml.config import TREND_MODEL_PATH
from ml.data_processing.cleaning import clean_telemetry, telemetry_to_frame
from ml.data_processing.feature_engineering import engineer_features

TREND_COLUMNS = [
    "cht",
    "egt",
    "vibration_rms",
    "oil_pressure",
    "health_index",
]


def _forecast_series(values: pd.Series, horizon: int = 5) -> dict:
    y = pd.to_numeric(values, errors="coerce").dropna().to_numpy(dtype=float)
    if y.size < 3:
        return {"slope": 0.0, "forecast": [], "direction": "stable"}
    x = np.arange(y.size, dtype=float)
    slope, intercept = np.polyfit(x, y, 1)
    future_x = np.arange(y.size, y.size + horizon, dtype=float)
    forecast = (slope * future_x + intercept).tolist()
    if slope > 0.15:
        direction = "increasing"
    elif slope < -0.15:
        direction = "decreasing"
    else:
        direction = "stable"
    return {
        "slope": round(float(slope), 4),
        "forecast": [round(v, 3) for v in forecast],
        "direction": direction,
    }


def forecast_trends(telemetry, horizon: int = 5) -> dict:
    featured = engineer_features(clean_telemetry(telemetry_to_frame(telemetry)))
    trends: dict[str, dict] = {}
    for column in TREND_COLUMNS:
        if column in featured.columns:
            trends[column] = _forecast_series(featured[column], horizon=horizon)
    if "health_index_rate_change" in featured.columns:
        trends["degradation"] = _forecast_series(featured["health_index"], horizon=horizon)
    return trends


def train_trend_forecaster(telemetry, *, model_path: Path | str = TREND_MODEL_PATH) -> Path:
    """Persist last-window slopes so inference can reuse a snapshot if needed."""
    trends = forecast_trends(telemetry)
    path = Path(model_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({"trends": trends}, path)
    return path


def predict_trends(telemetry, horizon: int = 5) -> dict:
    return forecast_trends(telemetry, horizon=horizon)
