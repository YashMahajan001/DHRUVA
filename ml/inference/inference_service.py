"""Public ML inference interface for backend integration.

The rest of DHRUVA should call:

    from ml.inference.inference_service import run_inference
    result = run_inference(telemetry)
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

from ml.config import ANOMALY_MODEL_PATH, FAULT_FEATURE_COLUMNS, FAULT_MODEL_PATH, RUL_MODEL_PATH
from ml.data_processing.cleaning import clean_telemetry, telemetry_to_frame
from ml.data_processing.feature_engineering import engineer_features
from ml.explainability.shap_explainer import explain_prediction
from ml.health_status import blend_health_index, health_from_index
from ml.rul.train import estimate_rul_from_health
from ml.sensor_drift.detector import detect_sensor_drift
from ml.trend_forecasting.train import forecast_trends
from ml.twin_adapter import extract_twin_state

logger = logging.getLogger(__name__)


def _json_safe(value: Any) -> Any:
    if isinstance(value, dict):
        return {str(k): _json_safe(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [_json_safe(v) for v in value]
    if isinstance(value, np.generic):
        return value.item()
    if isinstance(value, np.ndarray):
        return [_json_safe(v) for v in value.tolist()]
    if isinstance(value, pd.Timestamp):
        return value.isoformat()
    if isinstance(value, Path):
        return str(value)
    if isinstance(value, (float, np.floating)) and np.isnan(value):
        return None
    return value


def _last_row(featured: pd.DataFrame) -> pd.Series:
    return featured.iloc[-1]


def _heuristic_anomaly(row: pd.Series) -> dict:
    residual = abs(float(row.get("physics_prediction_residual") or 0.0))
    cht_rate = abs(float(row.get("cht_rate_change") or 0.0))
    egt_rate = abs(float(row.get("egt_rate_change") or 0.0))
    vib = float(row.get("vibration_rms") or 0.0)
    mismatch = abs(float(row.get("rpm_throttle_mismatch") or 0.0))
    score = min(
        1.0,
        0.08 * residual
        + 0.04 * cht_rate
        + 0.03 * egt_rate
        + 0.05 * max(0.0, vib - 2.0)
        + 0.4 * mismatch,
    )
    detected = score >= 0.45
    severity = "high" if score >= 0.75 else "medium" if score >= 0.45 else "low"
    return {"detected": detected, "score": round(score, 4), "severity": severity, "method": "heuristic"}


def _heuristic_fault(row: pd.Series) -> dict:
    cht = float(row.get("cht") or 0.0)
    egt = float(row.get("egt") or 0.0)
    oil_p = float(row.get("oil_pressure") or 0.0)
    vib = float(row.get("vibration_rms") or 0.0)
    alt_i = float(row.get("alternator_current") or 0.0)
    dropout = bool(row.get("sensor_dropout_flag", False))
    cht_res = abs(float(row.get("cht_residual") or 0.0))
    scores = {
        "sensor_dropout": 0.95 if dropout else 0.0,
        "cooling_degradation": min(1.0, max(0.0, (cht - 210) / 80) + cht_res / 40),
        "overheating": min(1.0, max(0.0, (cht - 240) / 60) + max(0.0, (egt - 850) / 200)),
        "lubrication_loss": min(1.0, max(0.0, (35 - oil_p) / 25)),
        "abnormal_vibration": min(1.0, max(0.0, (vib - 3.5) / 6)),
        "alternator_degradation": min(1.0, max(0.0, (12 - alt_i) / 12)),
        "injector_degradation": min(
            1.0, abs(float(row.get("fuel_efficiency") or 0.0) - 0.004) * 80
        ),
        "healthy": 0.4,
    }
    fault_type = max(scores, key=scores.get)
    confidence = float(scores[fault_type])
    if confidence < 0.35:
        fault_type, confidence = "healthy", 0.6
    return {"type": fault_type, "confidence": round(confidence, 4), "method": "heuristic"}


def _try_model_anomaly(telemetry) -> dict | None:
    if not Path(ANOMALY_MODEL_PATH).exists():
        return None
    try:
        from ml.anomaly_detection.train import predict_anomaly

        return predict_anomaly(telemetry)
    except Exception as exc:
        logger.warning("Anomaly model failed (%s); using heuristic", exc)
        return None


def _try_model_fault(telemetry) -> tuple[dict | None, Any, np.ndarray | None]:
    if not Path(FAULT_MODEL_PATH).exists():
        return None, None, None
    try:
        import joblib

        from ml.data_processing.preprocessing import TelemetryPreprocessor
        from ml.fault_classification.train import predict_fault

        result = predict_fault(telemetry)
        payload = joblib.load(FAULT_MODEL_PATH)
        preprocessor = TelemetryPreprocessor.load(payload["preprocessor_path"])
        _, scaled = preprocessor.transform(telemetry, scale=True)
        return result, payload["model"], scaled
    except Exception as exc:
        logger.warning("Fault model failed (%s); using heuristic", exc)
        return None, None, None


def _try_model_rul(telemetry, health_index: float, anomaly_score: float) -> dict:
    if not Path(RUL_MODEL_PATH).exists():
        return estimate_rul_from_health(health_index, anomaly_score)
    try:
        from ml.rul.train import predict_rul

        return predict_rul(
            telemetry,
            health_index=health_index,
            anomaly_score=anomaly_score,
        )
    except Exception as exc:
        logger.warning("RUL model failed (%s); using health mapping", exc)
        return estimate_rul_from_health(health_index, anomaly_score)


def run_inference(telemetry: Any) -> dict:
    """Run the full ML stack on telemetry and return a JSON-serializable result."""
    frame = telemetry_to_frame(telemetry)
    cleaned = clean_telemetry(frame)
    featured = engineer_features(cleaned)
    if featured.empty:
        raise ValueError("No telemetry rows available for inference")

    row = _last_row(featured)
    twin_state = extract_twin_state(row)

    anomaly = _try_model_anomaly(featured)
    if anomaly is None:
        anomaly = _heuristic_anomaly(row)

    fault, fault_model, fault_features = _try_model_fault(featured)
    if fault is None:
        fault = _heuristic_fault(row)

    physics_residual = float(row.get("physics_prediction_residual") or 0.0)
    twin_health = twin_state.get("health_index")
    if twin_health is None and pd.notna(row.get("health_index")) and float(row.get("health_index") or 0) > 0:
        twin_health = float(row["health_index"])

    safety_penalty = 0.0
    if not bool(row.get("data_valid", True)):
        safety_penalty += 25.0
    if fault.get("type") not in {"healthy", "none", None} and fault.get("type"):
        safety_penalty += 15.0 * float(fault.get("confidence") or 0.0)

    health_index = blend_health_index(
        twin_health=float(twin_health) if twin_health is not None else None,
        physics_residual=physics_residual,
        anomaly_score=float(anomaly.get("score") or 0.0),
        degradation=100.0 - 40.0 * float(anomaly.get("score") or 0.0),
        safety_penalty=safety_penalty,
    )
    twin_status = twin_state.get("status") or twin_state.get("health_state")
    status = str(twin_status) if twin_status else health_from_index(health_index)

    rul = _try_model_rul(featured, health_index, float(anomaly.get("score") or 0.0))
    drift = detect_sensor_drift(featured)
    trends = forecast_trends(featured)

    if fault_model is not None and fault_features is not None:
        explanation = explain_prediction(fault_model, fault_features, FAULT_FEATURE_COLUMNS)
    else:
        explanation = {
            "top_factors": [
                {"feature": name, "impact": round(abs(float(row.get(name) or 0.0)) / 100.0, 4)}
                for name in (
                    "cht_residual",
                    "physics_prediction_residual",
                    "cht_rate_change",
                    "egt_rate_change",
                    "oil_pressure",
                    "vibration_rms",
                )
                if abs(float(row.get(name) or 0.0)) > 0
            ][:5],
            "method": "telemetry_magnitude_fallback",
        }

    timestamp = row.get("timestamp")
    if isinstance(timestamp, pd.Timestamp):
        timestamp = timestamp.isoformat()
    elif timestamp is not None:
        timestamp = str(timestamp)

    result = {
        "engine_id": None if pd.isna(row.get("engine_id")) else str(row.get("engine_id")),
        "timestamp": timestamp,
        "health_index": round(float(health_index), 2),
        "status": status,
        "anomaly": {
            "detected": bool(anomaly.get("detected")),
            "score": float(anomaly.get("score") or 0.0),
            "severity": anomaly.get("severity"),
        },
        "fault": {
            "type": fault.get("type"),
            "confidence": float(fault.get("confidence") or 0.0),
        },
        "rul": {
            "hours": float(rul.get("hours") or 0.0),
            "uncertainty_hours": float(rul.get("uncertainty_hours") or 0.0),
        },
        "sensor_drift": {
            "detected": bool(drift.get("detected")),
            "sensor": drift.get("sensor"),
            "severity": drift.get("severity"),
        },
        "digital_twin_state": twin_state,
        "explanation": explanation,
        "trends": trends,
        "prototype_disclaimer": (
            "Health, RUL, and alert bands are prototype/demo thresholds, "
            "not certified aircraft operating limits."
        ),
    }
    return json.loads(json.dumps(_json_safe(result)))
