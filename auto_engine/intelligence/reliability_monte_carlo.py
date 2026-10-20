"""Monte Carlo Mission Reliability & Component Failure Simulation.

Simulates mission success probability, failure distribution across subsystems,
survival curves R(t), and sensitivity factors using stress-accelerated Weibull
failure distributions and reproducible random seeds.
"""

from __future__ import annotations

import random
from typing import List, Dict, Tuple, Optional
import math

from auto_engine.catalog.models import EngineCatalogEntry
from auto_engine.intelligence.models import (
    MissionScenario,
    MonteCarloReliabilityResult,
    SurvivalCurvePoint,
    SubsystemType,
)


# Standard Configurable Mission Scenarios
PRECONFIGURED_SCENARIOS: Dict[str, MissionScenario] = {
    "SCEN-TRACK-DAY": MissionScenario(
        scenario_id="SCEN-TRACK-DAY",
        name="Circuit Track Day High-Stress Endurance",
        duration_minutes=60.0,
        target_rpm=5500.0,
        throttle_mean=0.85,
        throttle_std=0.12,
        ambient_temp_c=34.0,
        altitude_m=150.0,
        description="Aggressive race-track lap session featuring sustained full-throttle pulls, high RPM operation, and elevated ambient temperature.",
    ),
    "SCEN-MOUNTAIN-CLIMB": MissionScenario(
        scenario_id="SCEN-MOUNTAIN-CLIMB",
        name="High-Altitude Mountain Pass Ascent",
        duration_minutes=45.0,
        target_rpm=4200.0,
        throttle_mean=0.75,
        throttle_std=0.08,
        ambient_temp_c=12.0,
        altitude_m=2400.0,
        description="Continuous uphill climb with high boost pressure demand in low atmospheric density ambient conditions.",
    ),
    "SCEN-SEVERE-TOWING": MissionScenario(
        scenario_id="SCEN-SEVERE-TOWING",
        name="Heavy Payload / High-Load Towing",
        duration_minutes=90.0,
        target_rpm=3200.0,
        throttle_mean=0.70,
        throttle_std=0.05,
        ambient_temp_c=32.0,
        altitude_m=300.0,
        description="Sustained high brake torque load at moderate engine speed, creating continuous thermal rejection stress on cooling and oil circuits.",
    ),
    "SCEN-HIGHWAY-CRUISE": MissionScenario(
        scenario_id="SCEN-HIGHWAY-CRUISE",
        name="Long-Distance Highway Cruise",
        duration_minutes=180.0,
        target_rpm=2400.0,
        throttle_mean=0.35,
        throttle_std=0.04,
        ambient_temp_c=25.0,
        altitude_m=200.0,
        description="Low-stress steady-state endurance cruising under nominal cooling and lubrication conditions.",
    ),
}


# Baseline Subsystem Weibull Reliability Parameters (under reference test cell conditions)
# shape (beta): > 1 indicates wear-out / fatigue aging; scale (eta) in hours
WEIBULL_SUBSYSTEM_BASELINES = {
    SubsystemType.EXHAUST_TURBO: {"beta": 2.2, "eta_hours": 3200.0},
    SubsystemType.COOLING: {"beta": 1.9, "eta_hours": 4500.0},
    SubsystemType.LUBRICATION: {"beta": 2.4, "eta_hours": 3800.0},
    SubsystemType.FUEL_SYSTEM: {"beta": 1.6, "eta_hours": 5000.0},
    SubsystemType.MECHANICAL_ROTATING: {"beta": 2.8, "eta_hours": 6000.0},
}


def sample_weibull(beta: float, eta: float, rng: random.Random) -> float:
    """Sample a time-to-failure from a Weibull distribution using inverse CDF.

    t = eta * (-ln(U))^(1/beta) where U ~ Uniform(0, 1)
    """
    u = max(1e-9, min(1.0 - 1e-9, rng.random()))
    return eta * ((-math.log(u)) ** (1.0 / beta))


def compute_stress_acceleration(
    subsystem: SubsystemType,
    scenario: MissionScenario,
    engine: EngineCatalogEntry,
) -> float:
    """Compute physics-based stress acceleration factor A_stress >= 1.0.

    Higher stress compresses the Weibull scale parameter (eta_eff = eta_base / A_stress).
    """
    # 1. Thermal stress factor (Arrhenius type)
    t_ref = 25.0
    delta_t = max(0.0, scenario.ambient_temp_c - t_ref)
    thermal_factor = 1.0 + (delta_t / 40.0)

    # 2. Mechanical load factor (throttle and RPM vs rated)
    rpm_ratio = scenario.target_rpm / max(1000.0, engine.specifications.rated_power_rpm)
    rpm_factor = max(0.5, rpm_ratio ** 1.5)
    load_factor = 0.5 + 0.8 * scenario.throttle_mean

    if subsystem == SubsystemType.EXHAUST_TURBO:
        # Turbochargers are sensitive to high RPM, high throttle (boost), and ambient heat
        return max(1.0, thermal_factor * 1.3 * (rpm_factor ** 1.4) * load_factor)
    elif subsystem == SubsystemType.COOLING:
        # Cooling systems are highly sensitive to ambient temperature and sustained high load
        return max(1.0, (thermal_factor ** 1.6) * load_factor)
    elif subsystem == SubsystemType.LUBRICATION:
        # Oil circuit stress scales with both RPM and thermal load
        return max(1.0, thermal_factor * (rpm_factor ** 1.2) * load_factor)
    elif subsystem == SubsystemType.FUEL_SYSTEM:
        # Fuel direct injection pumps and rails are driven by RPM and load duty
        return max(1.0, (rpm_factor ** 1.1) * load_factor)
    elif subsystem == SubsystemType.MECHANICAL_ROTATING:
        # Crankshaft and bearings are sensitive to peak cylinder pressure (throttle) and RPM
        return max(1.0, (rpm_factor ** 1.6) * (load_factor ** 1.2))
    return 1.0


def run_monte_carlo_mission_simulation(
    engine: EngineCatalogEntry,
    scenario: MissionScenario,
    iterations: int = 1000,
    random_seed: int = 42,
) -> MonteCarloReliabilityResult:
    """Execute a Monte Carlo mission reliability simulation with reproducible seed."""
    if not isinstance(iterations, int) or iterations <= 0 or math.isnan(iterations):
        iterations = 1000
    iterations = min(100000, max(10, iterations))

    duration_min = scenario.duration_minutes
    if math.isnan(duration_min) or math.isinf(duration_min) or duration_min <= 0.0:
        duration_min = 60.0
    mission_duration_hours = duration_min / 60.0

    rng = random.Random(random_seed)

    # Calculate effective Weibull parameters per subsystem for this scenario
    subsystems_active = list(WEIBULL_SUBSYSTEM_BASELINES.keys())
    effective_params: Dict[SubsystemType, Dict[str, float]] = {}

    for sub in subsystems_active:
        base = WEIBULL_SUBSYSTEM_BASELINES[sub]
        accel = compute_stress_acceleration(sub, scenario, engine)
        eta_eff = base["eta_hours"] / accel
        effective_params[sub] = {"beta": base["beta"], "eta": eta_eff}

    failures_by_subsystem: Dict[str, int] = {sub.value: 0 for sub in subsystems_active}
    success_count = 0
    failure_times: List[float] = []

    # Number of discrete time steps for survival curve R(t)
    num_curve_points = 10
    time_bins_hours = [
        (i / num_curve_points) * mission_duration_hours for i in range(1, num_curve_points + 1)
    ]
    survivors_at_time = [0] * num_curve_points

    for _ in range(iterations):
        min_ttf = float("inf")
        failed_subsystem: Optional[SubsystemType] = None

        for sub in subsystems_active:
            params = effective_params[sub]
            ttf = sample_weibull(params["beta"], params["eta"], rng)
            if ttf < min_ttf:
                min_ttf = ttf
                failed_subsystem = sub

        if min_ttf >= mission_duration_hours:
            success_count += 1
            failure_times.append(mission_duration_hours)
            for idx in range(num_curve_points):
                survivors_at_time[idx] += 1
        else:
            if failed_subsystem:
                failures_by_subsystem[failed_subsystem.value] += 1
            failure_times.append(min_ttf)
            for idx, t_bin in enumerate(time_bins_hours):
                if min_ttf >= t_bin:
                    survivors_at_time[idx] += 1

    success_rate = round(success_count / iterations, 4)
    total_failures = iterations - success_count

    # Subsystem failure distribution percentages
    failure_dist_pct: Dict[str, float] = {}
    for sub_str, count in failures_by_subsystem.items():
        if total_failures > 0:
            failure_dist_pct[sub_str] = round((count / total_failures) * 100.0, 1)
        else:
            failure_dist_pct[sub_str] = 0.0

    # Build survival curve
    curve_points: List[SurvivalCurvePoint] = [
        SurvivalCurvePoint(time_minutes=0.0, survival_probability=1.0)
    ]
    for idx, t_bin_hrs in enumerate(time_bins_hours):
        t_min = round(t_bin_hrs * 60.0, 1)
        prob = round(survivors_at_time[idx] / iterations, 4)
        curve_points.append(SurvivalCurvePoint(time_minutes=t_min, survival_probability=prob))

    # Mean Time Between Failures (MTBF) estimate in simulated hours
    # Calculated from the series system stress-accelerated Weibull distributions:
    # 1 / MTBF_sys = sum(1 / MTTF_i), where MTTF_i = eta_i * Gamma(1 + 1/beta_i)
    system_hazard_sum = 0.0
    for sub, params in effective_params.items():
        mttf_sub = params["eta"] * math.gamma(1.0 + 1.0 / params["beta"])
        system_hazard_sum += 1.0 / max(1.0, mttf_sub)
    mtbf_est = round(1.0 / max(1e-9, system_hazard_sum), 1)

    # Sensitivity factors
    sensitivity = {
        "ambient_temperature_effect": f"+10°C ambient temperature increases thermal stress acceleration by ~25%, primarily impacting {SubsystemType.COOLING.value} and {SubsystemType.EXHAUST_TURBO.value}.",
        "throttle_load_effect": f"Operating at mean throttle {scenario.throttle_mean*100:.0f}% accelerates mechanical and turbo wear by factor {compute_stress_acceleration(SubsystemType.EXHAUST_TURBO, scenario, engine):.2f}x relative to reference cruise.",
        "altitude_effect": f"At {scenario.altitude_m:.0f}m elevation, lower ambient air density forces higher turbo pressure ratios to maintain MAP.",
    }

    assumptions = [
        "Component failure times follow independent stress-accelerated 2-parameter Weibull distributions.",
        "Stresses are aggregated using multiplicative Arrhenius-Heywood acceleration factors.",
        "Simulation assumes engine starts from nominal operating temperatures with no pre-existing latent fractures.",
        "This is a simulated Monte Carlo engineering reliability estimate; it does NOT represent empirical warranty fleet statistics.",
    ]

    return MonteCarloReliabilityResult(
        scenario_id=scenario.scenario_id,
        scenario_name=scenario.name,
        total_iterations=iterations,
        random_seed=random_seed,
        mission_success_rate=success_rate,
        mtbf_hours_estimate=mtbf_est,
        failure_distribution_by_subsystem=failure_dist_pct,
        survival_curve=curve_points,
        sensitivity_factors=sensitivity,
        provenance_label="SIMULATED_RELIABILITY_ESTIMATE",
        assumptions_and_limitations=assumptions,
    )
