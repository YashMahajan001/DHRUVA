"""Automated tests for Monte Carlo Mission Reliability Simulation (Phase 2)."""

import pytest
from auto_engine.catalog.registry import engine_catalog
from auto_engine.intelligence.reliability_monte_carlo import (
    PRECONFIGURED_SCENARIOS,
    run_monte_carlo_mission_simulation,
)


def test_monte_carlo_reproducibility():
    """Verify that identical random seed produces identical reliability results."""
    engine = engine_catalog.get("AUTO-EA888-2.0T")
    scenario = PRECONFIGURED_SCENARIOS["SCEN-TRACK-DAY"]

    res1 = run_monte_carlo_mission_simulation(engine, scenario, iterations=500, random_seed=42)
    res2 = run_monte_carlo_mission_simulation(engine, scenario, iterations=500, random_seed=42)

    assert res1.mission_success_rate == res2.mission_success_rate
    assert res1.mtbf_hours_estimate == res2.mtbf_hours_estimate
    assert res1.failure_distribution_by_subsystem == res2.failure_distribution_by_subsystem
    assert len(res1.survival_curve) == len(res2.survival_curve)


def test_survival_curve_is_monotonically_non_increasing():
    """Survival probability R(t) must never increase over elapsed time."""
    engine = engine_catalog.get("AUTO-EA888-2.0T")
    scenario = PRECONFIGURED_SCENARIOS["SCEN-TRACK-DAY"]

    res = run_monte_carlo_mission_simulation(engine, scenario, iterations=1000, random_seed=99)
    probs = [pt.survival_probability for pt in res.survival_curve]

    assert probs[0] == 1.0  # R(0) = 1.0
    for i in range(1, len(probs)):
        assert probs[i] <= probs[i - 1] + 1e-9


def test_track_day_has_lower_survival_than_highway_cruise():
    """Severe track day stress should yield higher failure probability than mild highway cruise."""
    engine = engine_catalog.get("AUTO-EA888-2.0T")
    track_scen = PRECONFIGURED_SCENARIOS["SCEN-TRACK-DAY"]
    cruise_scen = PRECONFIGURED_SCENARIOS["SCEN-HIGHWAY-CRUISE"]

    res_track = run_monte_carlo_mission_simulation(engine, track_scen, iterations=1000, random_seed=123)
    res_cruise = run_monte_carlo_mission_simulation(engine, cruise_scen, iterations=1000, random_seed=123)

    assert res_track.provenance_label == "SIMULATED_RELIABILITY_ESTIMATE"
    assert res_track.mtbf_hours_estimate < res_cruise.mtbf_hours_estimate
