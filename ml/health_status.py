"""Prototype health-state mapping. These bands are demo thresholds only."""

from __future__ import annotations

from ml.config import (
    HEALTH_NORMAL_MIN,
    HEALTH_WARNING_MIN,
    HEALTH_WATCH_MIN,
    HEALTH_WEIGHTS,
)


def health_from_index(health_index: float) -> str:
    if health_index >= HEALTH_NORMAL_MIN:
        return "NORMAL"
    if health_index >= HEALTH_WATCH_MIN:
        return "WATCH"
    if health_index >= HEALTH_WARNING_MIN:
        return "WARNING"
    return "CRITICAL"


def blend_health_index(
    *,
    twin_health: float | None,
    physics_residual: float,
    anomaly_score: float,
    degradation: float,
    safety_penalty: float,
) -> float:
    if twin_health is not None and twin_health > 0.0:
        return float(max(0.0, min(100.0, twin_health)))


    residual_score = max(0.0, 100.0 - physics_residual * 8.0)
    anomaly_term = max(0.0, 100.0 - anomaly_score * 100.0)
    degradation_term = max(0.0, min(100.0, degradation))
    safety_term = max(0.0, 100.0 - safety_penalty)
    blended = (
        HEALTH_WEIGHTS["physics_residual"] * residual_score
        + HEALTH_WEIGHTS["anomaly_probability"] * anomaly_term
        + HEALTH_WEIGHTS["degradation_estimate"] * degradation_term
        + HEALTH_WEIGHTS["safety_rules"] * safety_term
    )
    return float(max(0.0, min(100.0, blended)))
