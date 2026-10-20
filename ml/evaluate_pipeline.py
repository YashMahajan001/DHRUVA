"""Leakage-safe, reproducible ML evaluation pipeline for Dhruva.

Evaluates:
1. Fault Classifier: Precision, Recall, F1, Balanced Accuracy, Confusion Matrix across all 11 classes.
2. Anomaly Detector: Isolation Forest Precision, Recall, F1, and FPR on healthy vs faulted states.
3. RUL Regressor: MAE, RMSE in hours, and empirical uncertainty interval coverage.

Splitting strategy:
- Group/temporal block split on the 880-sample ENG001 trajectories (first 75% train, last 25% test).
- Complete out-of-sample O320 flight mission (60 samples) assigned strictly to test set for true cross-engine generalization testing.
- Preprocessors fit strictly on train split, transforming test split without leakage.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor, IsolationForest, RandomForestClassifier
from sklearn.metrics import (
    balanced_accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    mean_absolute_error,
    mean_squared_error,
    precision_score,
    recall_score,
)

from ml.config import ANOMALY_FEATURE_COLUMNS, FAULT_FEATURE_COLUMNS, RUL_FEATURE_COLUMNS
from ml.data_processing.preprocessing import TelemetryPreprocessor


def run_evaluation(dataset_path: str = "data/processed/trained_dataset.csv") -> Dict[str, Any]:
    df = pd.read_csv(dataset_path)
    df["fault_label"] = df["fault_label"].astype(str).str.lower()

    # 1. Leakage-safe temporal/group split
    train_idx: list[int] = []
    test_idx: list[int] = []

    eng001 = df[df["engine_id"] == "ENG001"]
    for _, group in eng001.groupby("fault_label"):
        idx_list = group.index.tolist()
        split_point = int(len(idx_list) * 0.75)
        train_idx.extend(idx_list[:split_point])
        test_idx.extend(idx_list[split_point:])

    # Entire independent O320 flight into test set
    o320 = df[df["engine_id"] != "ENG001"]
    test_idx.extend(o320.index.tolist())

    train_df = df.loc[train_idx].reset_index(drop=True)
    test_df = df.loc[test_idx].reset_index(drop=True)

    results: Dict[str, Any] = {
        "dataset_rows": len(df),
        "train_rows": len(train_df),
        "test_rows": len(test_df),
        "split_strategy": "Temporal 75/25 on ENG001 + 100% held-out O320 flight mission",
    }

    # 2. Evaluate Fault Classifier
    pre_fault = TelemetryPreprocessor(feature_columns=FAULT_FEATURE_COLUMNS)
    _, train_scaled_fault = pre_fault.fit_transform(train_df, scale=True)
    _, test_scaled_fault = pre_fault.transform(test_df, scale=True)

    loaded_classifier = joblib.load("ml/artifacts/fault_classifier.joblib")
    encoder = loaded_classifier["label_encoder"]
    y_train_fault = encoder.transform(train_df["fault_label"])
    y_test_fault = encoder.transform(test_df["fault_label"])

    clf = RandomForestClassifier(n_estimators=250, max_depth=12, random_state=42, class_weight="balanced")
    clf.fit(train_scaled_fault, y_train_fault)
    preds_fault = clf.predict(test_scaled_fault)

    report_dict = classification_report(
        y_test_fault, preds_fault, target_names=encoder.classes_, output_dict=True, zero_division=0
    )
    conf_mat = confusion_matrix(y_test_fault, preds_fault).tolist()

    results["fault_classification"] = {
        "balanced_accuracy": round(float(balanced_accuracy_score(y_test_fault, preds_fault)), 4),
        "macro_f1": round(float(report_dict["macro avg"]["f1-score"]), 4),
        "weighted_f1": round(float(report_dict["weighted avg"]["f1-score"]), 4),
        "per_class": {
            cls: {
                "precision": round(report_dict[cls]["precision"], 3),
                "recall": round(report_dict[cls]["recall"], 3),
                "f1": round(report_dict[cls]["f1-score"], 3),
                "support": report_dict[cls]["support"],
            }
            for cls in encoder.classes_
            if cls in report_dict
        },
        "confusion_matrix": conf_mat,
        "classes": list(encoder.classes_),
    }

    # 3. Evaluate RUL Regressor
    pre_rul = TelemetryPreprocessor(feature_columns=RUL_FEATURE_COLUMNS)
    train_feat_rul, train_scaled_rul = pre_rul.fit_transform(train_df, scale=True)
    test_feat_rul, test_scaled_rul = pre_rul.transform(test_df, scale=True)

    reg = GradientBoostingRegressor(n_estimators=150, max_depth=3, learning_rate=0.08, random_state=42)
    reg.fit(train_scaled_rul, train_df["rul"])
    preds_rul = reg.predict(test_scaled_rul)
    y_test_rul = test_df["rul"]

    mae = float(mean_absolute_error(y_test_rul, preds_rul))
    rmse = float(np.sqrt(mean_squared_error(y_test_rul, preds_rul)))

    # Empirical interval coverage
    health_vals = test_feat_rul.get("health_index", pd.Series(70.0, index=test_df.index)).fillna(70.0)
    uncertainty_spread = 4.0 + (100.0 - health_vals) * 0.08
    in_interval = (y_test_rul >= (preds_rul - uncertainty_spread)) & (y_test_rul <= (preds_rul + uncertainty_spread))

    results["rul_regression"] = {
        "mae_hours": round(mae, 2),
        "rmse_hours": round(rmse, 2),
        "mean_interval_half_width": round(float(uncertainty_spread.mean()), 2),
        "empirical_interval_coverage_pct": round(float(in_interval.mean() * 100.0), 1),
        "interval_method": "Heuristic spread (coverage empirically measured, not 95% conformal)",
    }

    # 4. Evaluate Anomaly Detection
    train_healthy = train_df[train_df["fault_label"] == "healthy"]
    pre_anom = TelemetryPreprocessor(feature_columns=ANOMALY_FEATURE_COLUMNS)
    pre_anom.fit(train_healthy)
    _, test_scaled_anom = pre_anom.transform(test_df, scale=True)

    anom_model = IsolationForest(n_estimators=200, contamination=0.05, random_state=42)
    _, train_scaled_healthy = pre_anom.transform(train_healthy, scale=True)
    anom_model.fit(train_scaled_healthy)

    preds_anom = anom_model.predict(test_scaled_anom)
    y_true_anom = (test_df["fault_label"] != "healthy").astype(int)
    y_pred_anom = (preds_anom == -1).astype(int)

    results["anomaly_detection"] = {
        "precision": round(float(precision_score(y_true_anom, y_pred_anom, zero_division=0)), 3),
        "recall": round(float(recall_score(y_true_anom, y_pred_anom)), 3),
        "f1": round(float(f1_score(y_true_anom, y_pred_anom)), 3),
        "false_positive_rate_healthy": round(
            float(((y_pred_anom == 1) & (y_true_anom == 0)).sum() / max(1, (y_true_anom == 0).sum())), 3
        ),
        "contamination": 0.05,
    }

    return results


if __name__ == "__main__":
    res = run_evaluation()
    print(json.dumps(res, indent=2))
