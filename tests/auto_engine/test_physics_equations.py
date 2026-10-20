"""Unit tests for individual physics equations, units, and thermodynamic consistency."""

import math
import pytest
from auto_engine.physics.constants import (
    P_STD_PA,
    T_STD_K,
    R_AIR,
    AFR_STOICH_GASOLINE,
    AFR_STOICH_DIESEL,
)
from auto_engine.physics.airflow import (
    ambient_conditions,
    volumetric_efficiency,
    manifold_absolute_pressure,
    update_turbo_boost,
    air_mass_flow,
)
from auto_engine.physics.combustion import (
    target_air_fuel_ratio,
    fuel_flow_rate,
    indicated_thermal_efficiency,
    indicated_output,
)
from auto_engine.physics.mechanics import (
    friction_mean_effective_pressure,
    friction_torque,
    brake_torque_and_power,
    brake_specific_fuel_consumption,
    integrate_rotational_speed,
)
from auto_engine.physics.thermodynamics import (
    heat_rejection_partitioning,
    update_temperatures,
    exhaust_gas_temperature,
    cylinder_head_temperature,
)
from auto_engine.physics.lubrication import (
    oil_kinematic_viscosity_cst,
    oil_pressure_bar,
)


def test_ambient_conditions_isa():
    """Verify ambient pressure and temperature follow standard barometric lapse rate."""
    p0, t0, rho0 = ambient_conditions(0.0, 15.0)
    assert math.isclose(p0, P_STD_PA, rel_tol=1e-3)
    assert math.isclose(t0, T_STD_K, rel_tol=1e-3)
    assert math.isclose(rho0, 1.225, rel_tol=1e-2)

    # At 3000m altitude, pressure and density must be lower
    p3k, t3k, rho3k = ambient_conditions(3000.0, 15.0)
    assert p3k < p0
    assert t3k < t0
    assert rho3k < rho0


def test_volumetric_efficiency_peak():
    """Volumetric efficiency peaks near torque peak and drops smoothly toward idle/redline."""
    eta_idle = volumetric_efficiency(rpm=800.0, peak_torque_rpm=3000.0, redline_rpm=6500.0, eta_v_peak=0.95)
    eta_peak = volumetric_efficiency(rpm=3000.0, peak_torque_rpm=3000.0, redline_rpm=6500.0, eta_v_peak=0.95)
    eta_redline = volumetric_efficiency(rpm=6500.0, peak_torque_rpm=3000.0, redline_rpm=6500.0, eta_v_peak=0.95)

    assert math.isclose(eta_peak, 0.95, rel_tol=1e-3)
    assert eta_idle < eta_peak
    assert eta_redline < eta_peak
    assert eta_idle > 0.50


def test_manifold_pressure_behavior():
    """MAP increases monotonically with throttle opening and boost."""
    p_idle = manifold_absolute_pressure(throttle=0.0, ambient_pressure_pa=101325.0, current_boost_bar=0.0)
    p_half = manifold_absolute_pressure(throttle=0.5, ambient_pressure_pa=101325.0, current_boost_bar=0.0)
    p_wot = manifold_absolute_pressure(throttle=1.0, ambient_pressure_pa=101325.0, current_boost_bar=0.0)
    p_boost = manifold_absolute_pressure(throttle=1.0, ambient_pressure_pa=101325.0, current_boost_bar=1.0)

    assert p_idle < p_half < p_wot < p_boost
    assert math.isclose(p_wot, 101325.0, rel_tol=1e-2)
    assert math.isclose(p_boost, 201325.0, rel_tol=1e-2)


def test_speed_density_air_mass_flow():
    """Speed density air mass flow scales linearly with displacement and RPM."""
    # 2.0L engine at 3000 RPM, MAP = 100 kPa
    m_dot_1 = air_mass_flow(displacement_m3=0.002, rpm=3000.0, map_pa=100000.0, intake_temp_k=300.0, volumetric_eff=0.9)
    # 2.0L engine at 6000 RPM, MAP = 100 kPa
    m_dot_2 = air_mass_flow(displacement_m3=0.002, rpm=6000.0, map_pa=100000.0, intake_temp_k=300.0, volumetric_eff=0.9)

    assert m_dot_1 > 0.0
    assert math.isclose(m_dot_2, 2.0 * m_dot_1, rel_tol=1e-3)


def test_combustion_efficiency_and_power():
    """Indicated thermal efficiency, power, and torque relationships."""
    # 9.6:1 compression ratio
    eta_ind = indicated_thermal_efficiency(compression_ratio=9.6, rpm=3000.0, rated_rpm=6000.0)
    assert 0.30 <= eta_ind <= 0.45

    # Check P_ind = T_ind * omega
    m_dot_f = 0.005  # kg/s (~18 kg/h)
    lhv = 43.5      # MJ/kg
    rpm = 3000.0
    omega = (2.0 * math.pi * rpm) / 60.0

    p_ind, t_ind, imep = indicated_output(
        fuel_mass_flow_kg_s=m_dot_f,
        fuel_lhv_mj_kg=lhv,
        indicated_efficiency=eta_ind,
        rpm=rpm,
        displacement_m3=0.002,
    )
    assert p_ind > 0.0
    assert math.isclose(p_ind, t_ind * omega, rel_tol=1e-3)
    assert imep > 0.0


def test_friction_and_brake_power():
    """Brake torque is net indicated minus friction torque, power = torque * omega."""
    rpm = 4000.0
    omega = (2.0 * math.pi * rpm) / 60.0
    t_ind = 350.0  # Nm
    fmep = friction_mean_effective_pressure(rpm=rpm, imep_pa=1.2e6)
    t_fric = friction_torque(fmep_pa=fmep, displacement_m3=0.002)

    assert t_fric > 0.0
    t_brake, p_brake_w, p_brake_kw = brake_torque_and_power(t_ind, t_fric, rpm)
    assert t_brake == t_ind - t_fric
    assert math.isclose(p_brake_w, t_brake * omega, rel_tol=1e-3)
    assert math.isclose(p_brake_kw, p_brake_w / 1000.0, rel_tol=1e-4)


def test_heat_rejection_conservation():
    """Verify First Law energy balance: Q_dot_fuel = P_ind + Q_reject."""
    m_dot_f = 0.004
    lhv = 43.5
    p_ind = 60000.0  # 60 kW
    p_fric = 6000.0  # 6 kW
    q_fuel_total = m_dot_f * (lhv * 1e6)  # 174 kW

    q_exh, q_cool, q_oil, q_rad = heat_rejection_partitioning(m_dot_f, lhv, p_ind, p_fric)
    q_thermal_sum = q_exh + q_cool + (q_oil - p_fric) + q_rad
    assert math.isclose(q_thermal_sum, q_fuel_total - p_ind, rel_tol=1e-2)


def test_vogel_oil_viscosity_monotonically_decreasing():
    """Oil viscosity must decrease monotonically with increasing temperature."""
    temps = [-10.0, 20.0, 40.0, 80.0, 100.0, 130.0]
    viscosities = [oil_kinematic_viscosity_cst(t) for t in temps]

    for v1, v2 in zip(viscosities, viscosities[1:]):
        assert v1 > v2

    # Standard 100 deg C viscosity for 5W-40 should be ~12-16 cSt
    assert 11.0 <= oil_kinematic_viscosity_cst(100.0) <= 17.0


def test_oil_pressure_relief_valve_regulation():
    """Oil pressure increases with RPM but clamps strictly at PRV limit."""
    p_low = oil_pressure_bar(rpm=800.0, oil_temp_c=90.0, relief_valve_pressure_bar=6.0, rated_rpm=6000.0)
    p_mid = oil_pressure_bar(rpm=3000.0, oil_temp_c=90.0, relief_valve_pressure_bar=6.0, rated_rpm=6000.0)
    p_high = oil_pressure_bar(rpm=7000.0, oil_temp_c=90.0, relief_valve_pressure_bar=6.0, rated_rpm=6000.0)

    assert p_low < p_mid <= p_high
    assert p_high <= 6.0
