"""Fault classification with XGBoost, Random Forest fallback."""

from __future__ import annotations

import logging
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder

from ml.config import FAULT_FEATURE_COLUMNS, FAULT_MODEL_PATH, RANDOM_STATE
from ml.data_processing.preprocessing import TelemetryPreprocessor

logger = logging.getLogger(__name__)


def _build_classifier(random_state: int, num_classes: int | None = None):
    try:
        from xgboost import XGBClassifier

        params = {
            "n_estimators": 200,
            "max_depth": 6,
            "learning_rate": 0.08,
            "subsample": 0.9,
            "colsample_bytree": 0.9,
            "objective": "multi:softprob",
            "eval_metric": "mlogloss",
            "random_state": random_state,
            "n_jobs": -1,
        }
        if num_classes is not None and num_classes > 1:
            params["num_class"] = num_classes
        return XGBClassifier(**params)
    except Exception as exc:  # pragma: no cover - environment dependent
        logger.warning("XGBoost unavailable (%s); using RandomForestClassifier", exc)
        return RandomForestClassifier(
            n_estimators=250,
            max_depth=12,
            random_state=random_state,
            n_jobs=-1,
            class_weight="balanced",
        )


def train_fault_classifier(
    telemetry,
    *,
    label_column: str = "fault_label",
    model_path: Path | str = FAULT_MODEL_PATH,
    random_state: int = RANDOM_STATE,
) -> Path:
    preprocessor = TelemetryPreprocessor(feature_columns=FAULT_FEATURE_COLUMNS)
    featured, scaled = preprocessor.fit_transform(telemetry, scale=True)
    if label_column not in featured.columns:
        raise ValueError(f"Training data is missing '{label_column}'")

    labels = featured[label_column].astype(str).str.lower().fillna("healthy")
    encoder = LabelEncoder()
    encoded = encoder.fit_transform(labels)

    num_classes = int(len(np.unique(encoded)))
    model = _build_classifier(random_state, num_classes=num_classes)
    model.fit(scaled, encoded)

    path = Path(model_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    pre_path = path.with_name(path.stem + "_preprocessor.joblib")
    joblib.dump(
        {
            "model": model,
            "label_encoder": encoder,
            "feature_columns": FAULT_FEATURE_COLUMNS,
            "preprocessor_path": str(preprocessor.save(pre_path)),
            "backend": type(model).__name__,
        },
        path,
    )
    return path


def predict_fault(
    telemetry,
    *,
    model_path: Path | str = FAULT_MODEL_PATH,
) -> dict:
    payload = joblib.load(model_path)
    model = payload["model"]
    encoder: LabelEncoder = payload["label_encoder"]
    preprocessor = TelemetryPreprocessor.load(payload["preprocessor_path"])
    _, scaled = preprocessor.transform(telemetry, scale=True)

    if hasattr(model, "predict_proba"):
        proba = model.predict_proba(scaled)[-1]
        index = int(np.argmax(proba))
        confidence = float(proba[index])
    else:
        index = int(model.predict(scaled)[-1])
        confidence = 1.0
        proba = None

    label = str(encoder.inverse_transform([index])[0])
    if label in {"healthy", "none", "normal"}:
        fault_type = "healthy"
    else:
        fault_type = label
    return {
        "type": fault_type,
        "confidence": round(confidence, 4),
        "backend": payload.get("backend"),
    }


if __name__ == "__main__":
    from ml.utils.sample_data import make_training_dataset

    train_fault_classifier(make_training_dataset())
    print(f"Wrote {FAULT_MODEL_PATH}")
