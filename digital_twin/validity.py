"""Prototype data/physics validity checks (not certified safety limits)."""

from __future__ import annotations

from typing import Any

import math

COMPARE_CHANNELS = (
    "rpm",
    "cht",
    "egt",
    "oil_pressure",
    "oil_temp",
    "fuel_flow",
    "vibration_rms",
    "battery_voltage",
    "alternator_current",
)

NON_NEGATIVE = (
    "rpm",
    "oil_pressure",
    "fuel_flow",
    "vibration_rms",
    "battery_voltage",
    "alternator_current",
)


def _is_missing(value: Any) -> bool:
    if value is None:
        return True
    try:
        return math.isnan(float(value))
    except (TypeError, ValueError):
        return True


def validate_record(
    actual: dict[str, Any],
    norm_residuals: dict[str, float],
    cfg: dict[str, Any],
) -> tuple[bool, list[str]]:
    """Return (ok, flags). Flags are diagnostic only — not aircraft limits."""
    flags: list[str] = []
    for ch in COMPARE_CHANNELS:
        if _is_missing(actual.get(ch)):
            flags.append(f"missing:{ch}")
    for ch in NON_NEGATIVE:
        val = actual.get(ch)
        if not _is_missing(val) and float(val) < 0:
            flags.append(f"negative:{ch}")
    if str(actual.get("sensor_status", "OK")).startswith("DROPOUT"):
        flags.append("sensor_dropout")
    dq = actual.get("data_quality")
    if dq is not None and not _is_missing(dq) and float(dq) < 1.0:
        flags.append("data_quality")
    limit = float(cfg.get("excessive_norm_residual", 4.0))
    for ch, nr in norm_residuals.items():
        if abs(nr) > limit:
            flags.append(f"excessive_residual:{ch}")
    thr = actual.get("throttle")
    rpm = actual.get("rpm")
    if not _is_missing(thr) and not _is_missing(rpm):
        if float(thr) > 0.7 and float(rpm) < 400:
            flags.append("inconsistent:throttle_rpm")
        elif abs(float(thr)) < 0.05 and float(rpm) > 8000:
            flags.append("inconsistent:throttle_rpm")
    return (len(flags) == 0, flags)
