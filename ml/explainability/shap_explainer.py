"""SHAP explanations with a model-agnostic fallback."""

from __future__ import annotations

import logging
from typing import Any, Sequence

import numpy as np

logger = logging.getLogger(__name__)


def _fallback_contributions(
    model: Any,
    features: np.ndarray,
    feature_names: Sequence[str],
    top_k: int = 5,
) -> list[dict]:
    names = list(feature_names)
    row = np.asarray(features[-1], dtype=float)
    if hasattr(model, "feature_importances_"):
        weights = np.asarray(model.feature_importances_, dtype=float)
        impact = np.abs(weights * row)
    else:
        impact = np.abs(row)
    order = np.argsort(impact)[::-1][:top_k]
    total = float(impact[order].sum() or 1.0)
    return [
        {"feature": names[i] if i < len(names) else f"f{i}", "impact": round(float(impact[i] / total), 4)}
        for i in order
        if impact[i] > 0
    ]


def explain_prediction(
    model: Any,
    features: np.ndarray,
    feature_names: Sequence[str],
    *,
    top_k: int = 5,
) -> dict:
    names = list(feature_names)
    matrix = np.asarray(features, dtype=float)
    try:
        import shap

        explainer = None
        if hasattr(model, "predict_proba"):
            explainer = shap.TreeExplainer(model)
            shap_values = explainer.shap_values(matrix[-1:])
            if isinstance(shap_values, list):
                # Multi-class: use predicted class if possible.
                if hasattr(model, "predict"):
                    cls = int(model.predict(matrix[-1:])[0])
                    values = np.asarray(shap_values[cls])[-1]
                else:
                    values = np.mean([np.asarray(v)[-1] for v in shap_values], axis=0)
            else:
                values = np.asarray(shap_values)[-1]
                if values.ndim > 1:
                    values = values.mean(axis=-1)
        else:
            explainer = shap.Explainer(model.predict, matrix[: min(len(matrix), 32)])
            explanation = explainer(matrix[-1:])
            values = np.asarray(explanation.values)[-1]
        abs_values = np.abs(values)
        order = np.argsort(abs_values)[::-1][:top_k]
        total = float(abs_values[order].sum() or 1.0)
        top_factors = [
            {
                "feature": names[i] if i < len(names) else f"f{i}",
                "impact": round(float(abs_values[i] / total), 4),
            }
            for i in order
        ]
        return {"top_factors": top_factors, "method": "shap"}
    except Exception as exc:
        logger.info("SHAP unavailable or failed (%s); using fallback importances", exc)
        return {
            "top_factors": _fallback_contributions(model, matrix, names, top_k=top_k),
            "method": "feature_importance_fallback",
        }
