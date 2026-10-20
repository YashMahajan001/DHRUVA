"""Engine mechanical dynamics, friction, brake torque, and rotational inertia.

Explicitly implements Heywood/Chen-Flynn Friction Mean Effective Pressure (FMEP),
net brake torque, brake power, BSFC, and crankshaft rotational inertia integration.
"""

from __future__ import annotations

import math
from typing import Tuple


def friction_mean_effective_pressure(
    rpm: float,
    imep_pa: float,
    c0_pa: float = 48000.0,
    c1_pa_per_krpm: float = 14000.0,
    c2_pa_per_krpm2: float = 2400.0,
    c3_load_factor: float = 0.045,
) -> float:
    """Calculate engine Friction Mean Effective Pressure (FMEP) via Chen-Flynn model.

    Equation:
        FMEP = C0 + C1 * (RPM / 1000) + C2 * (RPM / 1000)^2 + C3 * IMEP

    Components:
        C0: Boundary lubrication friction (valvetrain lifters, seals) [Pa]
        C1: Hydrodynamic journal and rod bearing viscous drag [Pa / (kRPM)]
        C2: Piston ring pack viscous shearing and aerodynamic windage [Pa / (kRPM)^2]
        C3: Side-thrust cylinder wall friction under peak gas pressure [-]

    Args:
        rpm: Engine rotational speed [RPM]
        imep_pa: Indicated Mean Effective Pressure [Pa]
        c0_pa, c1_pa_per_krpm, c2_pa_per_krpm2, c3_load_factor: Chen-Flynn coefficients

    Returns:
        FMEP [Pa]
    """
    if rpm <= 0.0:
        return c0_pa

    krpm = rpm / 1000.0
    fmep_pa = c0_pa + c1_pa_per_krpm * krpm + c2_pa_per_krpm2 * (krpm ** 2) + c3_load_factor * max(0.0, imep_pa)
    return max(20000.0, fmep_pa)


def friction_torque(
    fmep_pa: float,
    displacement_m3: float,
) -> float:
    """Convert FMEP to equivalent opposing friction torque.

    Equation:
        T_fric = (FMEP * V_d) / (4 * pi)   [for 4-stroke engine]

    Args:
        fmep_pa: Friction Mean Effective Pressure [Pa]
        displacement_m3: Total engine swept displacement [m^3]

    Returns:
        Opposing friction torque [N*m]
    """
    if displacement_m3 <= 0.0 or fmep_pa <= 0.0:
        return 0.0
    return (fmep_pa * displacement_m3) / (4.0 * math.pi)


def brake_torque_and_power(
    indicated_torque_nm: float,
    friction_torque_nm: float,
    rpm: float,
) -> Tuple[float, float, float]:
    """Calculate Net Brake Torque, Brake Power (Watts and kW).

    Equations:
        T_brake = T_ind - T_fric
        P_brake = T_brake * omega = T_brake * (2 * pi * RPM / 60)

    Args:
        indicated_torque_nm: Indicated combustion torque [N*m]
        friction_torque_nm: Internal mechanical friction torque [N*m]
        rpm: Engine rotational speed [RPM]

    Returns:
        (brake_torque_nm, brake_power_w, brake_power_kw)
    """
    t_brake = indicated_torque_nm - friction_torque_nm
    omega_rad_s = (2.0 * math.pi * rpm) / 60.0
    p_brake_w = t_brake * omega_rad_s
    p_brake_kw = p_brake_w / 1000.0

    return t_brake, p_brake_w, p_brake_kw


def brake_specific_fuel_consumption(
    fuel_mass_flow_kg_s: float,
    brake_power_kw: float,
) -> float:
    """Calculate Brake Specific Fuel Consumption (BSFC).

    Equation:
        BSFC = (m_dot_fuel * 3600 * 1000) / P_brake_kw   [g / (kW * h)]

    Args:
        fuel_mass_flow_kg_s: Fuel mass flow rate [kg/s]
        brake_power_kw: Net brake power [kW]

    Returns:
        BSFC [g / (kW*h)], clamped to valid physical range (e.g. 180 - 1500 g/kWh)
    """
    if brake_power_kw <= 0.5 or fuel_mass_flow_kg_s <= 0.0:
        return 0.0

    bsfc = (fuel_mass_flow_kg_s * 3.6e6) / brake_power_kw
    return max(180.0, min(bsfc, 2500.0))


def integrate_rotational_speed(
    current_rpm: float,
    brake_torque_nm: float,
    load_torque_nm: float,
    inertia_kg_m2: float,
    idle_rpm: float,
    redline_rpm: float,
    dt_s: float,
) -> Tuple[float, bool, bool]:
    """Integrate crankshaft rotational acceleration using Newton's second law for rotation.

    Equation:
        d(omega)/dt = (T_brake - T_load) / Inertia
        omega(t + dt) = omega(t) + (d(omega)/dt) * dt
        RPM = omega * (60 / (2 * pi))

    Enforces:
        - Electronic Idle Speed Governor (ISC) when engine approaches stall.
        - Electronic Fuel-Cut / Soft Rev-Limiter at redline.

    Args:
        current_rpm: Current engine speed [RPM]
        brake_torque_nm: Net brake torque delivered by engine [N*m]
        load_torque_nm: External resisting load torque (dyno / vehicle / prop) [N*m]
        inertia_kg_m2: Total rotational inertia [kg*m^2]
        idle_rpm: Minimum governed idle speed [RPM]
        redline_rpm: Maximum allowable redline speed [RPM]
        dt_s: Integration time step [s]

    Returns:
        (new_rpm, is_rev_limiting, is_idle_governing)
    """
    if math.isnan(current_rpm) or math.isinf(current_rpm):
        current_rpm = idle_rpm
    if math.isnan(brake_torque_nm) or math.isinf(brake_torque_nm):
        brake_torque_nm = 0.0
    if math.isnan(load_torque_nm) or math.isinf(load_torque_nm):
        load_torque_nm = 0.0

    omega = (2.0 * math.pi * max(0.0, current_rpm)) / 60.0
    net_torque = brake_torque_nm - load_torque_nm

    is_rev_limiting = False
    is_idle_governing = False

    # Rotational acceleration d_omega / dt
    effective_inertia = max(0.02, inertia_kg_m2)

    # Redline rev-limiter intervention:
    if current_rpm >= redline_rpm:
        is_rev_limiting = True
        net_torque = min(net_torque, -80.0)

    d_omega_dt = net_torque / effective_inertia

    # Forward Euler integration
    new_omega = max(0.0, omega + d_omega_dt * dt_s)
    new_rpm = (new_omega * 60.0) / (2.0 * math.pi)

    # Hard ceiling rev-limiter bound
    if new_rpm >= redline_rpm:
        is_rev_limiting = True
        new_rpm = min(new_rpm, redline_rpm + 25.0)

    # Closed-loop idle governor:
    if new_rpm < idle_rpm:
        is_idle_governing = True
        # Dimensionally consistent closed-loop recovery scaling with integration step dt_s
        recovery_factor = min(1.0, max(0.0, 10.0 * dt_s))
        recovery_delta = (idle_rpm - new_rpm) * recovery_factor
        new_rpm = min(idle_rpm, new_rpm + recovery_delta)

    return new_rpm, is_rev_limiting, is_idle_governing
