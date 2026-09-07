"""Isolation Forest anomaly detection."""

from __future__ import annotations

from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

from ml.config import ANOMALY_FEATURE_COLUMNS, ANOMALY_MODEL_PATH, HEALTHY_FAULT_LABELS, RANDOM_STATE
from ml.data_processing.preprocessing import TelemetryPreprocessor


def _feature_matrix(featured: pd.DataFrame, columns: list[str]) -> np.ndarray:
    present = [c for c in columns if c in featured.columns]
    return featured[present].to_numpy(dtype=float)


def select_healthy(featured: pd.DataFrame) -> pd.DataFrame:
    if "fault_label" in featured.columns:
        labels = featured["fault_label"].astype(str).str.lower()
        healthy = featured[labels.isin(HEALTHY_FAULT_LABELS) | (labels == "healthy")]
        if not healthy.empty:
            return healthy
    if "health_index" in featured.columns:
        healthy = featured[featured["health_index"] >= 90]
        if not healthy.empty:
            return healthy
    return featured


def train_anomaly_detector(
    telemetry,
    *,
    model_path: Path | str = ANOMALY_MODEL_PATH,
    random_state: int = RANDOM_STATE,
) -> Path:
    preprocessor = TelemetryPreprocessor(feature_columns=ANOMALY_FEATURE_COLUMNS)
    featured, _ = preprocessor.fit_transform(telemetry, scale=True)
    healthy = select_healthy(featured)
    _, scaled = preprocessor.transform(healthy, scale=True)

    model = IsolationForest(
        n_estimators=200,
        contamination=0.05,
        random_state=random_state,
        n_jobs=-1,
    )
    model.fit(scaled)

    path = Path(model_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    pre_path = path.with_name(path.stem + "_preprocessor.joblib")
    joblib.dump(
        {
            "model": model,
            "feature_columns": ANOMALY_FEATURE_COLUMNS,
            "preprocessor_path": str(preprocessor.save(pre_path)),
        },
        path,
    )
    return path


def predict_anomaly(
    telemetry,
    *,
    model_path: Path | str = ANOMALY_MODEL_PATH,
) -> dict:
    payload = joblib.load(model_path)
    model: IsolationForest = payload["model"]
    preprocessor = TelemetryPreprocessor.load(payload["preprocessor_path"])
    featured, scaled = preprocessor.transform(telemetry, scale=True)
    scores = model.decision_function(scaled)
    preds = model.predict(scaled)
    # IsolationForest: lower decision_function => more anomalous.
    last_score = float(-scores[-1])
    normalized = float(1.0 / (1.0 + np.exp(-3.0 * last_score)))
    detected = bool(preds[-1] == -1 or normalized >= 0.55)
    if normalized >= 0.80:
        severity = "high"
    elif normalized >= 0.55:
        severity = "medium"
    else:
        severity = "low"
    return {
        "detected": detected,
        "score": round(normalized, 4),
        "severity": severity,
        "raw_score": round(last_score, 4),
        "window_anomaly_rate": float((preds == -1).mean()),
    }


if __name__ == "__main__":
    from ml.utils.sample_data import make_training_dataset

    train_anomaly_detector(make_training_dataset())
    print(f"Wrote {ANOMALY_MODEL_PATH}")
