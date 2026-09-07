"""Central physics-inspired healthy-engine relationships."""

from __future__ import annotations

from dataclasses import dataclass

from digital_twin.engines.base_engine import EngineParams
from digital_twin.physics.altitude_effects import altitude_power_factor, isa_ambient_temp_c
from digital_twin.physics.combustion import fuel_flow_lph, injection_timing_deg
from digital_twin.physics.lubrication import oil_pressure_psi
from digital_twin.physics.thermodynamics import cylinder_head_temp_c, exhaust_gas_temp_c, oil_temp_target_c


@dataclass
class HealthyState:
    altitude: float
    ambient_temp: float
    throttle: float
    rpm: float
    load: float
    fuel_flow: float
    cht: float
    egt: float
    oil_temp: float
    oil_pressure: float
    vibration_rms: float
    battery_voltage: float
    alternator_current: float
    injection_timing: float


def commanded_rpm(throttle: float, altitude_m: float, params: EngineParams) -> float:
    """rpm_cmd = idle + throttle * (max - idle) * altitude_power_factor."""
    span = params.max_rpm - params.idle_rpm
    return params.idle_rpm + throttle * span * altitude_power_factor(altitude_m)


def step_rpm(rpm_prev: float, rpm_cmd: float, params: EngineParams) -> float:
    """First-order lag: rpm += response * (cmd - rpm)."""
    return rpm_prev + params.rpm_response * (rpm_cmd - rpm_prev)


def engine_load(throttle: float, rpm: float, altitude_m: float, params: EngineParams) -> float:
    """load = throttle * (rpm / nominal) / altitude_power_factor, clipped."""
    power_avail = max(altitude_power_factor(altitude_m), 0.4)
    rpm_n = rpm / max(params.nominal_rpm, 1.0)
    return max(min(throttle * rpm_n / power_avail, 1.35), 0.0)


def vibration_rms(rpm: float, load: float, params: EngineParams) -> float:
    """vibration = base + factor * (k1 * rpm_n^2 + k2 * load)."""
    rpm_n = rpm / max(params.nominal_rpm, 1.0)
    return params.vibration_base + params.vibration_factor * (0.4 * rpm_n * rpm_n + 0.3 * load)


def electrical_output(rpm: float, load: float, params: EngineParams) -> tuple[float, float]:
    """Alternator current and battery voltage from rpm and load."""
    rpm_n = rpm / max(params.nominal_rpm, 1.0)
    current = params.electrical_generation_factor * params.alternator_current_gain * rpm_n * (0.5 + 0.5 * load)
    voltage = params.battery_nominal * (0.96 + 0.04 * min(rpm_n, 1.2))
    return current, voltage


def compute_healthy_step(
    *,
    altitude_m: float,
    throttle: float,
    sea_level_temp_c: float,
    rpm_prev: float,
    oil_temp_prev: float,
    params: EngineParams,
) -> HealthyState:
    """Advance one sample of coupled healthy telemetry."""
    ambient = isa_ambient_temp_c(altitude_m, sea_level_temp_c)
    throttle_c = max(min(throttle, 1.0), 0.0)
    rpm_cmd = commanded_rpm(throttle_c, altitude_m, params)
    rpm = max(step_rpm(rpm_prev, rpm_cmd, params), 0.0)
    load = engine_load(throttle_c, rpm, altitude_m, params)
    fuel = fuel_flow_lph(load, altitude_m, params)
    oil_tgt = oil_temp_target_c(load, ambient, params)
    oil_temp = oil_temp_prev + 0.08 * (oil_tgt - oil_temp_prev)
    cht = cylinder_head_temp_c(load, ambient, altitude_m, params)
    egt = exhaust_gas_temp_c(load, fuel, ambient, params)
    oil_p = oil_pressure_psi(rpm, oil_temp, params)
    vib = vibration_rms(rpm, load, params)
    alt_i, batt = electrical_output(rpm, load, params)
    timing = injection_timing_deg(rpm, load, params)
    return HealthyState(
        altitude=altitude_m,
        ambient_temp=ambient,
        throttle=throttle_c,
        rpm=rpm,
        load=load,
        fuel_flow=fuel,
        cht=cht,
        egt=egt,
        oil_temp=oil_temp,
        oil_pressure=oil_p,
        vibration_rms=vib,
        battery_voltage=batt,
        alternator_current=alt_i,
        injection_timing=timing,
    )
