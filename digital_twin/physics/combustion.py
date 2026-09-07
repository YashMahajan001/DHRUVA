"""Fuel flow and injection timing (synthetic)."""

from __future__ import annotations

from digital_twin.engines.base_engine import EngineParams
from digital_twin.physics.altitude_effects import altitude_power_factor


def fuel_flow_lph(load: float, altitude_m: float, params: EngineParams) -> float:
    """fuel_flow = idle + gain * load * efficiency * power * altitude_enrichment."""
    enrich = 1.0 + 0.15 * (1.0 - altitude_power_factor(altitude_m))
    return max(
        params.idle_fuel_flow
        + params.fuel_flow_gain
        * load
        * params.fuel_efficiency_factor
        * params.power_factor
        * enrich,
        0.0,
    )


def injection_timing_deg(rpm: float, load: float, params: EngineParams) -> float:
    """timing = baseline + rpm_gain * rpm_norm + 2 * load."""
    rpm_n = rpm / max(params.nominal_rpm, 1.0)
    return params.injection_timing_baseline + params.injection_timing_rpm_gain * rpm_n + 2.0 * load
