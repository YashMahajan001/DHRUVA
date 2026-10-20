"""Train anomaly, fault, and RUL models.

Prefers CSVs under data/synthetic when present, explicitly excluding the
Digital Twin CSV.  Otherwise uses compact ML fixtures (not the production
generator).
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

import pandas as pd

from ml.anomaly_detection.train import train_anomaly_detector
from ml.config import ANOMALY_MODEL_PATH, FAULT_MODEL_PATH, RUL_MODEL_PATH
from ml.data_processing.cleaning import clean_telemetry
from ml.data_processing.feature_engineering import engineer_features
from ml.fault_classification.train import train_fault_classifier
from ml.rul.train import train_rul_model
from ml.utils.sample_data import load_external_dataset, load_twin_dataset, make_training_dataset

logger = logging.getLogger(__name__)


def _report(path: Path, model_kind: str) -> None:
    print(f"  {model_kind}: {path}")


def _leakage_report(feature_columns: list[str], target: str) -> list[str]:
    """Return leaked feature names for a given target column."""
    return [c for c in feature_columns if c == target]


def _fit_and_report(
    telemetry,
    target_column: str,
    feature_columns: list[str],
    kind: str,
) -> tuple[dict[str, Any], Any, list[str]]:
    """Clean + engineer, then return summary metadata about the dataset."""
    from sklearn.preprocessing import LabelEncoder

    featured = engineer_features(clean_telemetry(telemetry))
    leaked = _leakage_report(feature_columns, target_column)
    if leaked:
        print(f"  WARNING {kind}: feature columns include target '{target_column}' ({leaked})")
    labels = None
    if target_column in featured.columns:
        values = featured[target_column]
        if kind == "classification":
            enc = LabelEncoder()
            labels = enc.fit_transform(values.astype(str).str.lower().fillna("healthy"))
        else:
            labels = values.to_numpy(dtype=float)
    return {
        "rows": int(len(featured)),
        "feature_count": len(feature_columns),
        "features": feature_columns,
        "target": target_column,
        "leaked_features": leaked,
    }, labels, featured


def main() -> None:
    external = load_external_dataset()
    fixtures = make_training_dataset()
    if external is not None and not external.empty:
        dataset = pd.concat([fixtures, external], ignore_index=True)
        source = "ml fixtures + data/ synthetic CSVs"
    else:
        dataset = fixtures
        source = "ml fixtures"
    print(f"Training on {len(dataset)} rows from {source}")
    processed_csv_path = Path("data/processed/trained_dataset.csv")
    processed_csv_path.parent.mkdir(parents=True, exist_ok=True)
    dataset.to_csv(processed_csv_path, index=False)
    print(f"Saved complete training dataset ({len(dataset)} rows) to {processed_csv_path}")

    print("anomaly ->", train_anomaly_detector(dataset))
    print("fault    ->", train_fault_classifier(dataset))
    print("rul      ->", train_rul_model(dataset))

    twin = load_twin_dataset()
    if twin is not None:
        print(f"Digital Twin CSV loaded: {len(twin)} rows (schema-validated, kept separate)")

    # Emit a training report for the record.
    summary = {
        "source": source,
        "rows": int(len(dataset)),
        "dataset_csv": str(processed_csv_path),
        "models": {
            "anomaly": str(ANOMALY_MODEL_PATH),
            "fault": str(FAULT_MODEL_PATH),
            "rul": str(RUL_MODEL_PATH),
        },
    }
    report_path = Path("ml/artifacts/training_report.json")
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(summary, indent=2))
    print(f"Report written to {report_path}")


if __name__ == "__main__":
    main()