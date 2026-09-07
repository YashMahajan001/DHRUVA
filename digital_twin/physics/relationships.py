"""Central physics-inspired healthy-engine relationships."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Tuple

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
    # --- new frontend-required channels ---
    manifold_pressure: float = 0.0
    coolant_temp: float = 0.0
    fuel_pressure: float = 0.0
    knock_index: float = 0.0
    harmonic_freq: float = 0.0
    vibration_kurtosis: float = 0.0
    vibration_peak_hz: float = 0.0
    compression_ratio: float = 0.0
    valve_clearance: float = 0.0
    radiator_airflow: float = 0.0
    coolant_delta: float = 0.0
    cht_cyl_1: float = 0.0
    cht_cyl_2: float = 0.0
    cht_cyl_3: float = 0.0
    cht_cyl_4: float = 0.0
    egt_cyl_1: float = 0.0
    egt_cyl_2: float = 0.0
    egt_cyl_3: float = 0.0
    egt_cyl_4: float = 0.0
    cyl_pressure_1: float = 0.0
    cyl_pressure_2: float = 0.0
    cyl_pressure_3: float = 0.0
    cyl_pressure_4: float = 0.0


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


# --- New physics helpers for frontend-required channels ---

def manifold_pressure_inhg(throttle: float, altitude_m: float, params: EngineParams) -> float:
    """MAP = base * throttle * altitude_power_factor (approximation)."""
    alt_f = altitude_power_factor(altitude_m)
    return params.manifold_pressure_base * max(throttle, 0.35) * alt_f


def coolant_temp_c(cht: float) -> float:
    """Coolant temp tracks CHT with a fixed offset (coolant runs cooler)."""
    return cht - 18.0


def fuel_rail_pressure(fuel_flow: float, rpm: float, params: EngineParams) -> float:
    """Fuel pressure = nominal adjusted by flow demand."""
    rpm_n = rpm / max(params.nominal_rpm, 1.0)
    return params.fuel_pressure_nominal * (0.9 + 0.1 * rpm_n)


def knock_index_pct(load: float, cht: float) -> float:
    """Knock risk rises with load and CHT; low under normal conditions."""
    # Nominal range 0-10 %, spikes at high load or CHT > 200
    base = 1.5 * load
    thermal = max((cht - 190.0) * 0.15, 0.0)
    return min(max(base + thermal, 0.0), 100.0)


def harmonic_freq_hz(rpm: float, cylinder_count: int) -> float:
    """Primary firing frequency = RPM/60 * cylinders/2 (4-stroke)."""
    return (rpm / 60.0) * (cylinder_count / 2.0)


def vibration_kurtosis_val(vib_rms: float) -> float:
    """Healthy kurtosis ~3 (Gaussian). Rises with vibration severity."""
    return 3.0 + max(vib_rms - 0.5, 0.0) * 0.8


def vibration_peak_hz_val(rpm: float) -> float:
    """Dominant vibration peak near 1x RPM frequency."""
    return rpm / 60.0


def compression_ratio_val(load: float, params: EngineParams) -> float:
    """Near-constant design parameter with very slight load effect."""
    return params.compression_ratio_nominal + 0.05 * load


def valve_clearance_val(cht: float, params: EngineParams) -> float:
    """Clearance decreases slightly as thermal expansion increases."""
    thermal_effect = max((cht - 150.0) * 0.0002, 0.0)
    return max(params.valve_clearance_nominal - thermal_effect, 0.05)


def radiator_airflow_val(altitude_m: float, throttle: float) -> float:
    """Airflow in m/s — higher at lower altitude and higher throttle (airspeed)."""
    alt_f = altitude_power_factor(altitude_m)
    return 8.0 + 12.0 * throttle * alt_f


def per_cylinder_spread(mean_val: float, spread: float = 3.0) -> Tuple[float, float, float, float]:
    """Deterministic per-cylinder spread around the mean (fixed offsets)."""
    return (
        mean_val - spread * 0.8,
        mean_val + spread * 1.2,
        mean_val - spread * 0.3,
        mean_val + spread * 0.5,
    )


def cylinder_pressure_bar(load: float, rpm: float, params: EngineParams) -> Tuple[float, float, float, float]:
    """Per-cylinder peak compression pressure (bar)."""
    rpm_n = rpm / max(params.nominal_rpm, 1.0)
    base = 8.0 + 4.0 * load * rpm_n
    return per_cylinder_spread(base, 0.3)


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

    # New channels
    mp = manifold_pressure_inhg(throttle_c, altitude_m, params)
    ct = coolant_temp_c(cht)
    fp = fuel_rail_pressure(fuel, rpm, params)
    ki = knock_index_pct(load, cht)
    hf = harmonic_freq_hz(rpm, params.cylinder_count)
    vk = vibration_kurtosis_val(vib)
    vph = vibration_peak_hz_val(rpm)
    cr = compression_ratio_val(load, params)
    vc = valve_clearance_val(cht, params)
    ra = radiator_airflow_val(altitude_m, throttle_c)
    cd = cht - ct  # coolant delta

    cht_cyls = per_cylinder_spread(cht, 4.0)
    egt_cyls = per_cylinder_spread(egt, 10.0)
    cp = cylinder_pressure_bar(load, rpm, params)

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
        manifold_pressure=mp,
        coolant_temp=ct,
        fuel_pressure=fp,
        knock_index=ki,
        harmonic_freq=hf,
        vibration_kurtosis=vk,
        vibration_peak_hz=vph,
        compression_ratio=cr,
        valve_clearance=vc,
        radiator_airflow=ra,
        coolant_delta=cd,
        cht_cyl_1=cht_cyls[0],
        cht_cyl_2=cht_cyls[1],
        cht_cyl_3=cht_cyls[2],
        cht_cyl_4=cht_cyls[3],
        egt_cyl_1=egt_cyls[0],
        egt_cyl_2=egt_cyls[1],
        egt_cyl_3=egt_cyls[2],
        egt_cyl_4=egt_cyls[3],
        cyl_pressure_1=cp[0],
        cyl_pressure_2=cp[1],
        cyl_pressure_3=cp[2],
        cyl_pressure_4=cp[3],
    )
