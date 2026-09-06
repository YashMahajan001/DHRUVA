"""Expected-vs-actual residuals using Phase 1 physics."""

from __future__ import annotations

import math
from typing import Any, Optional

from digital_twin.physics.relationships import HealthyState, compute_healthy_step
from digital_twin.state import ChannelResidual
from digital_twin.validity import COMPARE_CHANNELS

LAPSE = 0.0065


def sea_level_from_ambient(altitude_m: float, ambient_c: float) -> float:
    """Invert the Phase 1 ISA lapse so expected ambient tracks the sample."""
    return float(ambient_c) + LAPSE * max(float(altitude_m), 0.0)


def _finite(value: Any) -> Optional[float]:
    if value is None:
        return None
    try:
        num = float(value)
    except (TypeError, ValueError):
        return None
    if math.isnan(num):
        return None
    return num


def expected_from_operating(
    *,
    altitude_m: float,
    throttle: float,
    ambient_c: float,
    rpm_prev: float,
    oil_temp_prev: float,
    params: Any,
) -> HealthyState:
    """One physics step from operating conditions (not from actual sensors)."""
    return compute_healthy_step(
        altitude_m=altitude_m,
        throttle=throttle,
        sea_level_temp_c=sea_level_from_ambient(altitude_m, ambient_c),
        rpm_prev=rpm_prev,
        oil_temp_prev=oil_temp_prev,
        params=params,
    )


def build_residuals(
    expected: HealthyState,
    actual: dict[str, Any],
    scales: dict[str, float],
) -> dict[str, ChannelResidual]:
    out: dict[str, ChannelResidual] = {}
    for ch in COMPARE_CHANNELS:
        exp = float(getattr(expected, ch))
        act = _finite(actual.get(ch))
        if act is None:
            out[ch] = ChannelResidual(expected=exp, actual=None, residual=None, norm_residual=None)
            continue
        residual = act - exp
        scale = max(float(scales.get(ch, 1.0)), 1e-6)
        out[ch] = ChannelResidual(
            expected=exp,
            actual=act,
            residual=residual,
            norm_residual=residual / scale,
        )
    return out
