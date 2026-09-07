"""Degradation-based remaining useful life (prototype / demo only)."""

from __future__ import annotations

from pathlib import Path

import joblib
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor

from ml.config import (
    FAULT_FEATURE_COLUMNS,
    NOMINAL_LIFE_HOURS,
    RANDOM_STATE,
    RUL_MODEL_PATH,
    RUL_UNCERTAINTY_CEILING_HOURS,
    RUL_UNCERTAINTY_FLOOR_HOURS,
)
from ml.data_processing.preprocessing import TelemetryPreprocessor
from ml.health_status import health_from_index


def _hours_from_health(health_index: float) -> float:
    health = float(np.clip(health_index, 0.0, 100.0))
    return round(NOMINAL_LIFE_HOURS * (health / 100.0), 2)


def _uncertainty(health_index: float, anomaly_score: float = 0.0) -> float:
    spread = 4.0 + (100.0 - health_index) * 0.08 + anomaly_score * 4.0
    return round(float(np.clip(spread, RUL_UNCERTAINTY_FLOOR_HOURS, RUL_UNCERTAINTY_CEILING_HOURS)), 2)


def estimate_rul_from_health(health_index: float, anomaly_score: float = 0.0) -> dict:
    hours = _hours_from_health(health_index)
    return {
        "hours": hours,
        "uncertainty_hours": _uncertainty(health_index, anomaly_score),
        "method": "degradation_health_mapping",
        "note": "Prototype/demo estimate, not a certified aviation RUL.",
    }


def train_rul_model(
    telemetry,
    *,
    target_column: str = "rul",
    model_path: Path | str = RUL_MODEL_PATH,
    random_state: int = RANDOM_STATE,
) -> Path:
    preprocessor = TelemetryPreprocessor(feature_columns=FAULT_FEATURE_COLUMNS)
    featured, scaled = preprocessor.fit_transform(telemetry, scale=True)
    if target_column in featured.columns and featured[target_column].notna().any():
        y = featured[target_column].fillna(featured["health_index"] if "health_index" in featured.columns else 50.0)
    elif "health_index" in featured.columns:
        y = featured["health_index"].map(_hours_from_health)
    else:
        raise ValueError("Training data needs 'rul' or 'health_index'")

    model = GradientBoostingRegressor(
        n_estimators=150,
        max_depth=3,
        learning_rate=0.08,
        random_state=random_state,
    )
    model.fit(scaled, y.to_numpy(dtype=float))
    path = Path(model_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    pre_path = path.with_name(path.stem + "_preprocessor.joblib")
    joblib.dump(
        {
            "model": model,
            "feature_columns": FAULT_FEATURE_COLUMNS,
            "preprocessor_path": str(preprocessor.save(pre_path)),
        },
        path,
    )
    return path


def predict_rul(
    telemetry,
    *,
    model_path: Path | str = RUL_MODEL_PATH,
    health_index: float | None = None,
    anomaly_score: float = 0.0,
) -> dict:
    path = Path(model_path)
    if path.exists():
        payload = joblib.load(path)
        preprocessor = TelemetryPreprocessor.load(payload["preprocessor_path"])
        featured, scaled = preprocessor.transform(telemetry, scale=True)
        pred = float(payload["model"].predict(scaled)[-1])
        if health_index is None and "health_index" in featured.columns:
            health_index = float(featured["health_index"].iloc[-1])
        health_index = 70.0 if health_index is None else health_index
        hours = float(np.clip(pred, 0.0, NOMINAL_LIFE_HOURS * 1.5))
        return {
            "hours": round(hours, 2),
            "uncertainty_hours": _uncertainty(health_index, anomaly_score),
            "method": "gradient_boosting",
            "note": "Prototype/demo estimate, not a certified aviation RUL.",
            "status_hint": health_from_index(health_index),
        }
    if health_index is None:
        from ml.data_processing.cleaning import clean_telemetry, telemetry_to_frame

        featured = clean_telemetry(telemetry_to_frame(telemetry))
        health_index = float(featured["health_index"].iloc[-1]) if featured["health_index"].notna().any() else 80.0
    return estimate_rul_from_health(health_index, anomaly_score)


if __name__ == "__main__":
    from ml.utils.sample_data import make_training_dataset

    train_rul_model(make_training_dataset())
    print(f"Wrote {RUL_MODEL_PATH}")
