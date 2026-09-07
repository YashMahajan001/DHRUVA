"""Prototype component scores and overall Health Index (0–100)."""

from __future__ import annotations

import math
from typing import Any, Optional

from digital_twin.ml_interface import MLResult
from digital_twin.state import ChannelResidual


def _channel_score(res: ChannelResidual) -> Optional[float]:
    if res.norm_residual is None:
        return None
    return 100.0 * math.exp(-abs(res.norm_residual))


def component_scores(
    residuals: dict[str, ChannelResidual],
    cfg: dict[str, Any],
    data_quality: float,
    missing_count: int,
) -> dict[str, float]:
    mapping: dict[str, list[str]] = cfg["component_channels"]
    scores: dict[str, float] = {}
    for name, channels in mapping.items():
        vals = []
        for ch in channels:
            item = residuals.get(ch)
            if item is None:
                continue
            sc = _channel_score(item)
            if sc is not None:
                vals.append(sc)
        scores[name] = sum(vals) / len(vals) if vals else 50.0
    sensor = scores.get("sensor", 100.0)
    dq_pen = 100.0 * max(0.0, min(float(data_quality), 1.0))
    if missing_count:
        dq_pen = min(dq_pen, 40.0)
    scores["sensor"] = 0.6 * sensor + 0.4 * dq_pen
    return scores


def health_state_from_index(index: float, cfg: dict[str, Any]) -> str:
    bands = sorted(cfg["health_states"], key=lambda b: b["min"], reverse=True)
    for band in bands:
        if index >= band["min"]:
            return band["name"]
    return "CRITICAL"


def overall_health_index(
    components: dict[str, float],
    cfg: dict[str, Any],
    ml_result: MLResult | None,
) -> float:
    weights: dict[str, float] = cfg["component_weights"]
    wsum = sum(weights.get(k, 0.0) for k in components)
    if wsum <= 0:
        weighted = 50.0
    else:
        weighted = sum(components[k] * weights.get(k, 0.0) for k in components) / wsum
    worst = min(components.values()) if components else weighted
    blend = float(cfg.get("min_component_blend", 0.0))
    index = (1.0 - blend) * weighted + blend * worst
    index = _blend_ml(index, ml_result, float(cfg.get("ml_blend_weight", 0.0)))
    return max(0.0, min(100.0, index))


def _blend_ml(index: float, ml_result: MLResult | None, weight: float) -> float:
    if ml_result is None:
        return index
    conf = ml_result.confidence if ml_result.confidence is not None else 0.5
    penalty = 0.0
    if ml_result.anomaly_probability is not None:
        penalty = max(penalty, ml_result.anomaly_probability)
    if ml_result.degradation_estimate is not None:
        penalty = max(penalty, ml_result.degradation_estimate)
    return index * (1.0 - weight * conf * penalty)
