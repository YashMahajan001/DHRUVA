"""Thermal channels (synthetic CHT / EGT / oil temperature)."""

from __future__ import annotations

from digital_twin.engines.base_engine import EngineParams
from digital_twin.physics.altitude_effects import cooling_air_factor


def cylinder_head_temp_c(load: float, ambient_c: float, altitude_m: float, params: EngineParams) -> float:
    """cht = ambient + (cht_gain * thermal * load) / cooling(altitude, ambient)."""
    cool = max(cooling_air_factor(altitude_m, ambient_c) * params.cooling_factor, 0.35)
    return ambient_c + (params.cht_gain * params.thermal_factor * load) / cool


def exhaust_gas_temp_c(load: float, fuel_flow: float, ambient_c: float, params: EngineParams) -> float:
    """egt = ambient + egt_base + egt_gain * load + k * excess_fuel."""
    expected = params.idle_fuel_flow + params.fuel_flow_gain * load
    excess = max(fuel_flow - expected, 0.0)
    return ambient_c + params.egt_base + params.egt_gain * load + 4.0 * excess


def oil_temp_target_c(load: float, ambient_c: float, params: EngineParams) -> float:
    """oil_tgt = ambient + 40 + oil_thermal * load."""
    return ambient_c + 40.0 + params.oil_thermal_gain * load
