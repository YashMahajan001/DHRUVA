"""Altitude / atmosphere helpers (simplified, non-certified)."""

from __future__ import annotations


def isa_ambient_temp_c(altitude_m: float, sea_level_temp_c: float = 15.0) -> float:
    """Linear lapse: T = T_sl - 0.0065 * max(h, 0)."""
    return sea_level_temp_c - 0.0065 * max(altitude_m, 0.0)


def density_ratio(altitude_m: float) -> float:
    """Approximate tropospheric density ratio, clipped for stability."""
    h = max(altitude_m, 0.0)
    inner = max(1.0 - 2.255e-05 * h, 0.35)
    return max(inner**4.256, 0.25)


def altitude_power_factor(altitude_m: float) -> float:
    """Representative available-power scale vs altitude."""
    return 0.55 + 0.45 * density_ratio(altitude_m)


def cooling_air_factor(altitude_m: float, ambient_temp_c: float) -> float:
    """Cooling effectiveness: density / hot-day penalty."""
    dens = density_ratio(altitude_m)
    heat_penalty = 1.0 + max(ambient_temp_c - 15.0, 0.0) / 80.0
    return dens / heat_penalty
