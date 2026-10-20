"""Airflow, manifold dynamics, and turbocharger boost modeling.

Explicitly implements ISA atmospheric conditions, throttle body mass flow,
volumetric efficiency curves, turbocharger boost dynamics, and manifold absolute pressure.
"""

from __future__ import annotations

import math
from typing import Tuple

from auto_engine.physics.constants import (
    P_STD_PA,
    T_STD_K,
    R_AIR,
    G_ACCEL,
)


def ambient_conditions(altitude_m: float = 0.0, ambient_temp_c: float = 25.0) -> Tuple[float, float, float]:
    """Calculate ambient barometric pressure, temperature, and air density.

    Equations:
        T_amb(h) = T_0 - L * h  (Troposphere temperature lapse rate L = 0.0065 K/m)
        P_amb(h) = P_0 * (T_amb / T_0) ^ (g / (R * L))
        rho_amb = P_amb / (R * T_amb)

    Args:
        altitude_m: Altitude above mean sea level [m]
        ambient_temp_c: Reference sea-level or measured ambient temperature [deg C]

    Returns:
        (pressure_pa, temp_k, density_kg_m3)
    """
    # Guard against invalid negative or extreme altitudes
    alt = max(0.0, min(altitude_m, 15000.0))
    lapse_rate = 0.0065  # K/m

    t_sea_level_k = ambient_temp_c + 273.15
    t_ambient_k = max(210.0, t_sea_level_k - lapse_rate * alt)

    # Standard barometric formula
    exponent = G_ACCEL / (R_AIR * lapse_rate)  # ~5.25588
    pressure_pa = P_STD_PA * math.pow(t_ambient_k / t_sea_level_k, exponent)
    density_kg_m3 = pressure_pa / (R_AIR * t_ambient_k)

    return pressure_pa, t_ambient_k, density_kg_m3


def volumetric_efficiency(
    rpm: float,
    peak_torque_rpm: float,
    redline_rpm: float,
    eta_v_peak: float = 0.94,
) -> float:
    """Calculate volumetric efficiency as a physically-grounded function of engine speed.

    Equation:
        eta_v = eta_v_peak * [1.0 - k_falloff * ((rpm - rpm_peak) / 1000.0)^2]
        Clamped to physically realistic positive bounds [0.35, 1.25].

    Args:
        rpm: Engine rotational speed [RPM]
        peak_torque_rpm: Engine speed at which volumetric efficiency peaks [RPM]
        redline_rpm: Maximum rated engine speed [RPM]
        eta_v_peak: Maximum volumetric efficiency at peak torque point [-]

    Returns:
        Volumetric efficiency [-]
    """
    if rpm <= 0.0:
        return 0.0

    # Falloff coefficient calibrated so efficiency drops ~15-20% at idle and redline
    delta_k_rpm = (rpm - peak_torque_rpm) / 1000.0
    falloff = 0.018 * (delta_k_rpm ** 2)
    eta_v = eta_v_peak * (1.0 - falloff)

    return max(0.35, min(eta_v, 1.25))


def manifold_absolute_pressure(
    throttle: float,
    ambient_pressure_pa: float,
    current_boost_bar: float = 0.0,
    idle_map_ratio: float = 0.30,
) -> float:
    """Calculate intake Manifold Absolute Pressure (MAP).

    Equation:
        MAP_na = P_amb * [c_idle + (1 - c_idle) * throttle^1.12]
        MAP_total = MAP_na + (current_boost_bar * 100,000 Pa)

    Args:
        throttle: Normalized throttle opening [0.0 - 1.0]
        ambient_pressure_pa: Ambient atmospheric pressure [Pa]
        current_boost_bar: Gauge turbocharger boost pressure [bar]
        idle_map_ratio: Ratio of MAP to ambient at idle throttle [-]

    Returns:
        Manifold Absolute Pressure [Pa]
    """
    th = max(0.0, min(throttle, 1.0))
    na_factor = idle_map_ratio + (1.0 - idle_map_ratio) * math.pow(th, 1.12)
    map_na = ambient_pressure_pa * na_factor
    boost_pa = max(0.0, current_boost_bar) * 100000.0

    return map_na + boost_pa


def update_turbo_boost(
    current_boost_bar: float,
    throttle: float,
    rpm: float,
    max_boost_bar: float,
    spool_rpm_threshold: float,
    rated_rpm: float,
    time_constant_s: float,
    dt_s: float,
) -> float:
    """Integrate first-order turbocharger spool dynamics.

    Equation:
        P_boost_target = max_boost * f_spool(rpm) * throttle
        dP_boost / dt = (P_boost_target - P_boost) / tau_turbo
        P_boost(t + dt) = P_boost(t) + dP_boost/dt * dt

    Args:
        current_boost_bar: Previous boost gauge pressure [bar]
        throttle: Commanded throttle position [0.0 - 1.0]
        rpm: Engine rotational speed [RPM]
        max_boost_bar: Maximum design boost gauge pressure [bar]
        spool_rpm_threshold: RPM at which exhaust energy begins spinning the turbine [RPM]
        rated_rpm: Engine rated speed [RPM]
        time_constant_s: Spool inertia lag time constant [s]
        dt_s: Time integration step [s]

    Returns:
        Updated gauge boost pressure [bar]
    """
    if max_boost_bar <= 0.0 or rpm < spool_rpm_threshold:
        target_boost = 0.0
    else:
        rpm_span = max(1.0, rated_rpm - spool_rpm_threshold)
        rpm_fraction = max(0.0, min((rpm - spool_rpm_threshold) / rpm_span, 1.0))
        spool_factor = math.pow(rpm_fraction, 1.15)

        # Electronic wastegate duty cycle: taper boost at high RPM to match rated power
        taper_start = rated_rpm * 0.68
        if rpm > taper_start:
            rpm_excess = (rpm - taper_start) / max(1.0, rated_rpm - taper_start)
            wastegate_taper = max(0.48, 1.0 - 0.52 * rpm_excess)
        else:
            wastegate_taper = 1.0

        target_boost = max_boost_bar * spool_factor * wastegate_taper * max(0.0, min(throttle, 1.0))

    if time_constant_s <= 0.0:
        return target_boost

    alpha = dt_s / (time_constant_s + dt_s)
    new_boost = current_boost_bar + alpha * (target_boost - current_boost_bar)
    return max(0.0, min(new_boost, max_boost_bar * 1.05))


def air_mass_flow(
    displacement_m3: float,
    rpm: float,
    map_pa: float,
    intake_temp_k: float,
    volumetric_eff: float,
) -> float:
    """Calculate inducted air mass flow rate using the speed-density equation.

    Equation:
        m_dot_air = (V_d * RPM / 120) * rho_man * eta_v
        rho_man = MAP / (R_air * T_man)

    Args:
        displacement_m3: Total engine displacement [m^3]
        rpm: Engine speed [RPM]
        map_pa: Intake manifold absolute pressure [Pa]
        intake_temp_k: Intake manifold charge air temperature [K]
        volumetric_eff: Volumetric efficiency [-]

    Returns:
        Air mass flow rate [kg/s]
    """
    if rpm <= 0.0 or displacement_m3 <= 0.0:
        return 0.0

    rho_man = map_pa / (R_AIR * max(200.0, intake_temp_k))
    # For a 4-stroke engine, displacement volume is swept once per 2 revolutions (RPM / 120 in seconds)
    swept_volume_per_second = (displacement_m3 * rpm) / 120.0
    return swept_volume_per_second * rho_man * volumetric_eff
