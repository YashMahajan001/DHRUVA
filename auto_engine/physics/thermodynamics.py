"""Lumped thermal capacitance and heat transfer modeling.

Explicitly implements heat rejection partitioning, thermostat-regulated cooling,
oil heat exchangers, exhaust gas temperature (EGT), and cylinder head temperature (CHT).
"""

from __future__ import annotations

import math
from typing import Tuple

from auto_engine.physics.constants import CP_EXHAUST


def heat_rejection_partitioning(
    fuel_mass_flow_kg_s: float,
    fuel_lhv_mj_kg: float,
    indicated_power_w: float,
    friction_power_w: float,
) -> Tuple[float, float, float, float]:
    """Calculate heat distribution across exhaust, coolant jacket, oil circuit, and ambient radiation.

    First Law of Thermodynamics energy balance:
        Q_dot_fuel = P_ind + Q_dot_exhaust + Q_dot_coolant + Q_dot_oil_net + Q_dot_radiation

    Args:
        fuel_mass_flow_kg_s: Fuel mass consumption [kg/s]
        fuel_lhv_mj_kg: Fuel Lower Heating Value [MJ/kg]
        indicated_power_w: Indicated work output [W]
        friction_power_w: Mechanical friction dissipation [W]

    Returns:
        (q_dot_exhaust_w, q_dot_coolant_w, q_dot_oil_w, q_dot_radiation_w)
    """
    q_dot_fuel_w = fuel_mass_flow_kg_s * (fuel_lhv_mj_kg * 1e6)
    q_rejected_w = max(0.0, q_dot_fuel_w - indicated_power_w)

    # Standard internal combustion engine heat balance fractions
    q_exhaust_w = 0.50 * q_rejected_w
    q_coolant_w = 0.36 * q_rejected_w
    # Oil absorbs undercrown piston heat + 100% of internal mechanical friction
    q_oil_w = 0.10 * q_rejected_w + max(0.0, friction_power_w)
    q_radiation_w = 0.04 * q_rejected_w

    return q_exhaust_w, q_coolant_w, q_oil_w, q_radiation_w


def update_temperatures(
    current_coolant_temp_c: float,
    current_oil_temp_c: float,
    ambient_temp_c: float,
    q_dot_coolant_w: float,
    q_dot_oil_w: float,
    c_coolant_j_k: float,
    c_oil_j_k: float,
    radiator_coeff_w_k: float,
    oil_cooler_coeff_w_k: float,
    dt_s: float,
    thermostat_open_temp_c: float = 84.0,
    thermostat_full_temp_c: float = 94.0,
) -> Tuple[float, float]:
    """Integrate lumped thermal capacitance models for coolant and oil circuits.

    Equations:
        f_thermostat = smoothstep(T_cool, T_open, T_full)
        Q_dot_rad = radiator_coeff * (T_cool - T_amb) * f_thermostat
        dT_cool / dt = (Q_dot_coolant - Q_dot_rad) / C_coolant

        Q_dot_oil_hx = oil_cooler_coeff * (T_oil - T_cool) + 30.0 * (T_oil - T_amb)
        dT_oil / dt = (Q_dot_oil - Q_dot_oil_hx) / C_oil

    Args:
        current_coolant_temp_c: Previous coolant temperature [deg C]
        current_oil_temp_c: Previous oil temperature [deg C]
        ambient_temp_c: Ambient air temperature [deg C]
        q_dot_coolant_w: Rate of heat transferred from combustion chambers into coolant [W]
        q_dot_oil_w: Rate of heat transferred into oil circuit [W]
        c_coolant_j_k: Lumped thermal capacitance of coolant mass [J/K]
        c_oil_j_k: Lumped thermal capacitance of oil mass [J/K]
        radiator_coeff_w_k: Maximum radiator heat rejection rate [W/K]
        oil_cooler_coeff_w_k: Oil-to-coolant heat exchanger effectiveness [W/K]
        dt_s: Simulation integration time step [s]

    Returns:
        (new_coolant_temp_c, new_oil_temp_c)
    """
    # Thermostat valve progressive opening fraction [0.05 (bypass) -> 1.0 (full radiator flow)]
    if current_coolant_temp_c <= thermostat_open_temp_c:
        thermostat_fraction = 0.05
    elif current_coolant_temp_c >= thermostat_full_temp_c:
        thermostat_fraction = 1.0
    else:
        thermostat_fraction = 0.05 + 0.95 * (
            (current_coolant_temp_c - thermostat_open_temp_c) / (thermostat_full_temp_c - thermostat_open_temp_c)
        )

    # Radiator heat rejection to ambient
    delta_t_rad = max(0.0, current_coolant_temp_c - ambient_temp_c)
    q_rad_out_w = radiator_coeff_w_k * delta_t_rad * thermostat_fraction

    # Coolant differential update
    d_t_cool_dt = (q_dot_coolant_w - q_rad_out_w) / max(1000.0, c_coolant_j_k)
    new_coolant_temp = max(ambient_temp_c, current_coolant_temp_c + d_t_cool_dt * dt_s)

    # Oil cooler heat rejection to coolant & sump convection to ambient
    delta_t_oil_cool = current_oil_temp_c - current_coolant_temp_c
    delta_t_oil_amb = max(0.0, current_oil_temp_c - ambient_temp_c)
    q_oil_out_w = (oil_cooler_coeff_w_k * delta_t_oil_cool) + (35.0 * delta_t_oil_amb)

    # Oil differential update
    d_t_oil_dt = (q_dot_oil_w - q_oil_out_w) / max(1000.0, c_oil_j_k)
    new_oil_temp = max(ambient_temp_c, current_oil_temp_c + d_t_oil_dt * dt_s)

    return new_coolant_temp, new_oil_temp


def exhaust_gas_temperature(
    ambient_temp_c: float,
    q_dot_exhaust_w: float,
    exhaust_mass_flow_kg_s: float,
    max_egt_limit_c: float = 1050.0,
) -> float:
    """Calculate Exhaust Gas Temperature (EGT) from enthalpy conservation.

    Equation:
        T_egt = T_amb + Q_dot_exhaust / (m_dot_exhaust * c_p,exhaust)

    Args:
        ambient_temp_c: Ambient reference temperature [deg C]
        q_dot_exhaust_w: Sensible heat rate carried by exhaust stream [W]
        exhaust_mass_flow_kg_s: Total exhaust mass flow (air + fuel) [kg/s]
        max_egt_limit_c: Physical upper saturation limit [deg C]

    Returns:
        EGT [deg C]
    """
    if exhaust_mass_flow_kg_s <= 1e-4 or q_dot_exhaust_w <= 0.0:
        return ambient_temp_c

    delta_t_k = q_dot_exhaust_w / (exhaust_mass_flow_kg_s * CP_EXHAUST)
    egt_c = ambient_temp_c + delta_t_k
    return max(ambient_temp_c, min(egt_c, max_egt_limit_c))


def cylinder_head_temperature(
    coolant_temp_c: float,
    engine_load_ratio: float,
    max_thermal_lift_c: float = 45.0,
) -> float:
    """Calculate Cylinder Head Temperature (CHT) relative to coolant jacket.

    In liquid-cooled cylinder heads, CHT operates at a steady-state thermal lift
    above the coolant jacket proportional to the heat flux / engine load.

    Args:
        coolant_temp_c: Coolant jacket temperature [deg C]
        engine_load_ratio: Current engine power-to-rated ratio [0.0 - 1.2]
        max_thermal_lift_c: Maximum steady-state temp gradient from flame face to coolant [deg C]

    Returns:
        CHT [deg C]
    """
    load_clamped = max(0.0, min(engine_load_ratio, 1.25))
    thermal_lift = 8.0 + max_thermal_lift_c * (load_clamped ** 0.85)
    return coolant_temp_c + thermal_lift
