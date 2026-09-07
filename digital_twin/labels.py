"""Twin health, residuals, and synthetic RUL columns on telemetry frames."""

from __future__ import annotations

from typing import Sequence

import numpy as np
import pandas as pd

from digital_twin.twin import DigitalTwin

RESIDUAL_CHANNELS: tuple[str, ...] = (
    "cht",
    "egt",
    "oil_pressure",
    "fuel_flow",
    "rpm",
    "vibration_rms",
)

TWIN_LABEL_COLUMNS: list[str] = [
    "health_index",
    "rul",
    *[f"{ch}_residual" for ch in RESIDUAL_CHANNELS],
]


def attach_twin_labels(df: pd.DataFrame) -> pd.DataFrame:
    """Run the Digital Twin over ``df`` and append health, residuals, and RUL."""
    if df.empty:
        return df
    model_id = str(df["model_id"].iloc[0])
    twin = DigitalTwin(model_id)
    states = twin.process_dataframe(df)
    cfg = twin.cfg
    health = np.array([s.health_index for s in states], dtype=float)
    dt = _sample_dt(df)
    rul = compute_rul(health, dt, cfg)

    out = df.copy()
    out["health_index"] = health
    out["rul"] = rul
    for ch in RESIDUAL_CHANNELS:
        out[f"{ch}_residual"] = [
            None if s.residuals[ch].residual is None else round(s.residuals[ch].residual, 6)
            for s in states
        ]
    return out


def compute_rul(health: Sequence[float], dt: float, cfg: dict) -> np.ndarray:
    """Seconds remaining until health_index reaches the failure threshold.

    If the series never crosses the threshold, time-to-threshold is linearly
    extrapolated from the trailing slope. Non-degrading runs are clipped to
    ``rul_max_s`` (right-censored / plateau labels).
    """
    h = np.asarray(health, dtype=float)
    n = len(h)
    times = np.arange(n, dtype=float) * float(dt)
    threshold = float(cfg.get("rul_failure_threshold", 40.0))
    rul_max = float(cfg.get("rul_max_s", 3600.0))
    hit = np.flatnonzero(h <= threshold)
    if hit.size:
        t_fail = float(times[int(hit[0])])
    else:
        t_fail = _extrapolated_failure_time(times, h, threshold, rul_max)
    return np.clip(t_fail - times, 0.0, rul_max).round(2)


def _extrapolated_failure_time(
    times: np.ndarray,
    health: np.ndarray,
    threshold: float,
    rul_max: float,
) -> float:
    n = len(health)
    span = max(10, n // 4)
    t_w = times[-span:]
    h_w = health[-span:]
    if len(t_w) < 2 or float(np.ptp(t_w)) < 1e-9:
        return float(times[-1]) + rul_max
    slope = float(np.polyfit(t_w, h_w, 1)[0])
    if slope >= -1e-4:
        return float(times[-1]) + rul_max
    t_fail = float(t_w[-1] + (h_w[-1] - threshold) / (-slope))
    return max(t_fail, float(times[-1]))


def _sample_dt(df: pd.DataFrame) -> float:
    if len(df) < 2:
        return 1.0
    ts = pd.to_datetime(df["timestamp"], utc=True)
    delta = (ts.iloc[1] - ts.iloc[0]).total_seconds()
    return float(delta) if delta > 0 else 1.0
