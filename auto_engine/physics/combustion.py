"""Combustion thermodynamics, fuel flow, and indicated work modeling.

Explicitly implements air-fuel ratio stoichiometry, fuel mass/volume consumption,
indicated thermal efficiency, Indicated Mean Effective Pressure (IMEP), and indicated torque.
"""

from __future__ import annotations

import math
from typing import Tuple

from auto_engine.physics.constants import AFR_STOICH_GASOLINE, GAMMA_EXHAUST


def target_air_fuel_ratio(
    throttle: float,
    boost_bar: float,
    base_afr: float = AFR_STOICH_GASOLINE,
    is_diesel: bool = False,
) -> float:
    """Determine commanded Air-Fuel Ratio (AFR) based on operating load and boost.

    In spark-ignition gasoline engines, rich mixtures (lambda ~ 0.82-0.88) are commanded
    at high throttle and high boost to prevent knock and cool exhaust valves/catalyst.
    Diesel/Aero-diesel operates lean of stoichiometric across the entire envelope.

    Args:
        throttle: Throttle opening [0.0 - 1.0]
        boost_bar: Gauge boost pressure [bar]
        base_afr: Stoichiometric baseline AFR [-]
        is_diesel: Whether the engine is compression-ignition

    Returns:
        Target Air-Fuel Ratio (mass air / mass fuel) [-]
    """
    if is_diesel:
        # Diesels operate lean (AFR 18-50)
        return max(18.0, 45.0 - throttle * 25.0)

    # Gasoline spark-ignition:
    if throttle > 0.85 or boost_bar > 0.5:
        # Full load enrichment (lambda ~ 0.86)
        return base_afr * 0.86
    elif throttle > 0.65 or boost_bar > 0.2:
        # Moderate load enrichment (lambda ~ 0.92)
        return base_afr * 0.92
    else:
        # Stoichiometric closed-loop operation (lambda = 1.0)
        return base_afr


def fuel_flow_rate(
    air_mass_flow_kg_s: float,
    target_afr: float,
    fuel_density_kg_l: float,
) -> Tuple[float, float]:
    """Calculate fuel mass flow rate and volumetric hourly consumption.

    Equations:
        m_dot_fuel [kg/s] = m_dot_air [kg/s] / AFR
        V_dot_fuel [L/h] = (m_dot_fuel / rho_fuel) * 3600.0

    Args:
        air_mass_flow_kg_s: Air intake mass flow rate [kg/s]
        target_afr: Commanded air-fuel ratio [-]
        fuel_density_kg_l: Fuel density [kg/L]

    Returns:
        (fuel_mass_flow_kg_s, fuel_volume_flow_l_per_h)
    """
    if air_mass_flow_kg_s <= 0.0 or target_afr <= 0.0 or fuel_density_kg_l <= 0.0:
        return 0.0, 0.0

    m_dot_fuel = air_mass_flow_kg_s / target_afr
    # Convert kg/s to L/h: (kg/s) / (kg/L) * 3600 s/h
    v_dot_lph = (m_dot_fuel / fuel_density_kg_l) * 3600.0
    return m_dot_fuel, v_dot_lph


def indicated_thermal_efficiency(
    compression_ratio: float,
    rpm: float,
    rated_rpm: float,
    gamma: float = 1.32,
    combustion_quality: float = 0.82,
) -> float:
    """Calculate indicated thermal efficiency using air-standard cycle with real-gas correction.

    Equation:
        eta_ideal = 1.0 - (1.0 / (r_c ^ (gamma - 1)))
        eta_ind = eta_ideal * combustion_quality * f_speed(rpm)

    Args:
        compression_ratio: Geometric compression ratio [-]
        rpm: Current engine speed [RPM]
        rated_rpm: Rated engine speed [RPM]
        gamma: Effective polytropic expansion ratio of combustion products [-]
        combustion_quality: Real-engine combustion factor (heat loss + timing losses) [-]

    Returns:
        Indicated thermal efficiency [-] (typically 0.32 - 0.44)
    """
    if compression_ratio <= 1.0:
        return 0.0

    eta_ideal = 1.0 - (1.0 / math.pow(compression_ratio, gamma - 1.0))

    # Speed-dependent flame speed and heat loss correction
    rpm_norm = max(0.1, min(rpm / max(1.0, rated_rpm), 1.2))
    speed_factor = 0.92 + 0.12 * rpm_norm - 0.04 * (rpm_norm ** 2)

    eta_ind = eta_ideal * combustion_quality * speed_factor
    return max(0.15, min(eta_ind, 0.52))


def indicated_output(
    fuel_mass_flow_kg_s: float,
    fuel_lhv_mj_kg: float,
    indicated_efficiency: float,
    rpm: float,
    displacement_m3: float,
) -> Tuple[float, float, float]:
    """Calculate Indicated Power, Indicated Torque, and IMEP.

    Equations:
        Q_dot_fuel = m_dot_fuel * LHV  [W]
        P_ind = Q_dot_fuel * eta_ind    [W]
        T_ind = P_ind / omega           [N*m]  where omega = 2 * pi * RPM / 60
        IMEP = (P_ind * 120) / (V_d * RPM)  [Pa]

    Args:
        fuel_mass_flow_kg_s: Fuel mass consumption rate [kg/s]
        fuel_lhv_mj_kg: Fuel Lower Heating Value [MJ/kg]
        indicated_efficiency: Indicated thermal efficiency [-]
        rpm: Engine rotational speed [RPM]
        displacement_m3: Total engine displacement [m^3]

    Returns:
        (indicated_power_w, indicated_torque_nm, imep_pa)
    """
    if fuel_mass_flow_kg_s <= 0.0 or indicated_efficiency <= 0.0 or rpm <= 0.0:
        return 0.0, 0.0, 0.0

    q_dot_fuel_w = fuel_mass_flow_kg_s * (fuel_lhv_mj_kg * 1e6)
    p_ind_w = q_dot_fuel_w * indicated_efficiency

    omega_rad_s = (2.0 * math.pi * rpm) / 60.0
    t_ind_nm = p_ind_w / omega_rad_s

    # IMEP in Pa: (Work per cycle) / Displacement
    # For 4-stroke: Work per cycle = P_ind * 2 / (RPM / 60) = P_ind * 120 / RPM
    imep_pa = (p_ind_w * 120.0) / (displacement_m3 * rpm) if displacement_m3 > 0.0 else 0.0

    return p_ind_w, t_ind_nm, imep_pa
