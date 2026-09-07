"""Oil pressure relationship (synthetic)."""

from __future__ import annotations

from digital_twin.engines.base_engine import EngineParams


def oil_pressure_psi(rpm: float, oil_temp_c: float, params: EngineParams) -> float:
    """oil_pressure = (idle + gain * rpm_norm) * oil_factor * viscosity_factor."""
    rpm_n = rpm / max(params.nominal_rpm, 1.0)
    visc = max(1.15 - 0.004 * max(oil_temp_c - 80.0, 0.0), 0.7)
    return max((params.oil_pressure_idle + params.oil_pressure_gain * rpm_n) * params.oil_factor * visc, 0.0)
