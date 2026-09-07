"""Train anomaly, fault, and RUL models.

Prefers CSVs under data/synthetic or data/processed when present.
Otherwise uses compact ML fixtures (not the production generator).
"""

from __future__ import annotations

from ml.anomaly_detection.train import train_anomaly_detector
from ml.config import ANOMALY_MODEL_PATH, FAULT_MODEL_PATH, RUL_MODEL_PATH
from ml.fault_classification.train import train_fault_classifier
from ml.rul.train import train_rul_model
from ml.utils.sample_data import load_external_dataset, make_training_dataset


def main() -> None:
    dataset = load_external_dataset()
    if dataset is None:
        dataset = make_training_dataset()
        source = "ml fixtures"
    else:
        source = "data/ CSV files"
    print(f"Training on {len(dataset)} rows from {source}")
    print("anomaly ->", train_anomaly_detector(dataset))
    print("fault    ->", train_fault_classifier(dataset))
    print("rul      ->", train_rul_model(dataset))
    print("Saved:", ANOMALY_MODEL_PATH, FAULT_MODEL_PATH, RUL_MODEL_PATH, sep="\n  ")


if __name__ == "__main__":
    main()
