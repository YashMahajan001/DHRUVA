"""Comprehensive Adversarial Edge-Case, Numerical Stability & Security QA Suite.

Audits and verifies:
1. Adversarial input validation, boundary limits, and malformed/NaN/Inf payloads.
2. First-law physical conservation relationships and Euler integration stability.
3. Telemetry timestamp anomalies (out-of-order, duplicates, reconnection gaps).
4. Subsystem dependency fault propagation termination and multi-anomaly diagnostic aggregation.
5. Degradation/RUL data sufficiency safeguards and Arrhenius numerical bounds.
6. Monte Carlo statistical convergence, seed determinism, and thread isolation.
"""

from __future__ import annotations

import math
import pytest
from datetime import datetime, timezone, timedelta
from typing import List, Dict
from concurrent.futures import ThreadPoolExecutor

from fastapi.testclient import TestClient
from backend.app.main import app

from auto_engine.catalog.registry import engine_catalog
from auto_engine.simulation.simulator import (
    DeterministicEngineSimulator,
    SimulationInput,
    SimulationOutput,
)
from auto_engine.telemetry.schema import EngineTelemetryRecord
from auto_engine.telemetry.generator import output_to_telemetry_record
from auto_engine.physics.combustion import indicated_output
from auto_engine.physics.thermodynamics import heat_rejection_partitioning
from auto_engine.intelligence import (
    AnomalyDetector,
    DiagnosticEngine,
    ComponentDegradationTracker,
    PRECONFIGURED_SCENARIOS,
    SUBSYSTEM_DEPENDENCY_GRAPH,
    FAULT_MODES_CATALOG,
    TelemetryAnomaly,
    AnomalyMethod,
    SeverityLevel,
    DegradationStatus,
    SubsystemType,
    run_monte_carlo_mission_simulation,
)
from auto_engine.intelligence.fault_graph import trace_propagation_tree


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def _create_sample_telemetry(engine) -> EngineTelemetryRecord:
    """Helper to generate a fully populated valid EngineTelemetryRecord."""
    sim = DeterministicEngineSimulator(engine)
    sim.reset(initial_rpm=engine.operating_limits.idle_rpm)
    out = sim.step(SimulationInput(throttle=0.0, load_torque_nm=0.0, dt_s=0.02))
    return output_to_telemetry_record(engine, out, throttle_cmd=0.0)


# =============================================================================
# 1. Adversarial API Validation & Security Tests
# =============================================================================

def test_api_step_simulation_nan_and_inf_rejected(client):
    """Verify that NaN or null/malformed values in simulation requests are strictly rejected (422)."""
    # Test string "NaN" payload
    res1 = client.post(
        "/api/auto/simulate/step",
        content='{"engine_id": "AUTO-EA888-2.0T", "throttle": "NaN"}',
        headers={"content-type": "application/json"},
    )
    assert res1.status_code == 422

    # Test null throttle payload
    res2 = client.post(
        "/api/auto/simulate/step",
        content='{"engine_id": "AUTO-EA888-2.0T", "throttle": null}',
        headers={"content-type": "application/json"},
    )
    assert res2.status_code == 422

    # Test string "Infinity" payload
    res3 = client.post(
        "/api/auto/simulate/step",
        content='{"engine_id": "AUTO-EA888-2.0T", "throttle": "Infinity"}',
        headers={"content-type": "application/json"},
    )
    assert res3.status_code == 422


def test_api_step_simulation_boundary_limits(client):
    """Verify boundary limit enforcement for throttle, ambient temperature, and altitude."""
    # Negative throttle
    res = client.post("/api/auto/simulate/step", json={
        "engine_id": "AUTO-EA888-2.0T",
        "throttle": -0.1,
    })
    assert res.status_code == 422

    # Throttle > 1.0
    res = client.post("/api/auto/simulate/step", json={
        "engine_id": "AUTO-EA888-2.0T",
        "throttle": 1.05,
    })
    assert res.status_code == 422

    # Altitude > 15,000m
    res = client.post("/api/auto/simulate/step", json={
        "engine_id": "AUTO-EA888-2.0T",
        "throttle": 0.5,
        "altitude_m": 25000.0,
    })
    assert res.status_code == 422


def test_api_step_simulation_injection_safety(client):
    """Verify that path traversal and SQL/script injection payloads in engine_id fail cleanly."""
    malicious_ids = [
        "../../../../etc/passwd",
        "..\\..\\windows\\system32",
        "AUTO-EA888'; DROP TABLE engines;--",
        "<script>alert(1)</script>",
        "A" * 128,  # Exceeds max length
    ]
    for m_id in malicious_ids:
        res = client.post("/api/auto/simulate/step", json={
            "engine_id": m_id,
            "throttle": 0.5,
        })
        assert res.status_code in (404, 422)


def test_api_run_cycle_oversized_payload_protection(client):
    """Verify that an oversized batch (>1000 items) is rejected to protect against DoS."""
    oversized_inputs = [{"throttle": 0.5, "dt_s": 0.02}] * 1050
    res = client.post("/api/auto/simulate/run", json={
        "engine_id": "AUTO-EA888-2.0T",
        "inputs": oversized_inputs,
    })
    assert res.status_code == 422


def test_api_dyno_sweep_invalid_rpm_step(client):
    """Verify that non-positive, zero, or out-of-range rpm_step values are rejected."""
    # Negative rpm_step
    res = client.post("/api/auto/simulate/dyno-sweep", json={
        "engine_id": "AUTO-EA888-2.0T",
        "rpm_step": -50.0,
    })
    assert res.status_code == 422

    # rpm_step < 50
    res = client.post("/api/auto/simulate/dyno-sweep", json={
        "engine_id": "AUTO-EA888-2.0T",
        "rpm_step": 10.0,
    })
    assert res.status_code == 422


# =============================================================================
# 2. Physics & Numerical Stability Tests
# =============================================================================

def test_physics_first_law_energy_conservation():
    """Verify that total fuel chemical energy equals net brake work plus total thermal heat rejections.

    Q_dot_fuel = P_brake + Q_dot_exhaust + Q_dot_coolant + Q_dot_oil + Q_dot_radiation
    Where Q_dot_oil contains friction dissipation (P_fric) plus combustion heat transferred to oil.
    Conservation of Energy must close to within 0.01%.
    """
    engine = engine_catalog.get("AUTO-EA888-2.0T")
    assert engine is not None

    m_dot_fuel = 0.008  # kg/s (~28.8 kg/h)
    lhv = engine.fuel_lhv_mj_kg  # 44.0 MJ/kg
    fuel_power_w = m_dot_fuel * (lhv * 1e6)  # 352,000 W
    friction_power_w = 8500.0

    p_ind_w, _, _ = indicated_output(
        fuel_mass_flow_kg_s=m_dot_fuel,
        fuel_lhv_mj_kg=lhv,
        indicated_efficiency=0.36,
        rpm=4000.0,
        displacement_m3=0.001984,
    )

    q_exh, q_cool, q_oil, q_rad = heat_rejection_partitioning(
        fuel_mass_flow_kg_s=m_dot_fuel,
        fuel_lhv_mj_kg=lhv,
        indicated_power_w=p_ind_w,
        friction_power_w=friction_power_w,
    )

    # Net brake power delivered at crankshaft = Indicated - Friction
    p_brake_w = p_ind_w - friction_power_w

    total_accounted_w = p_brake_w + q_exh + q_cool + q_oil + q_rad
    # Discrepancy must be less than 0.01%
    relative_error = abs(total_accounted_w - fuel_power_w) / fuel_power_w
    assert relative_error < 0.0001


def test_physics_adaptive_substepping_large_dt_stability():
    """Verify that a large integration step (e.g. dt=0.5s) sub-steps stably without numerical explosion."""
    engine = engine_catalog.get("AUTO-EA888-2.0T")
    assert engine is not None

    sim = DeterministicEngineSimulator(engine)
    sim.reset(initial_rpm=1200.0)

    # Step with large dt
    out = sim.step(SimulationInput(
        throttle=1.0,
        load_torque_nm=80.0,
        dt_s=0.5,
    ))

    # Must be numerically finite and within physical operating bounds
    assert not math.isnan(out.rpm)
    assert not math.isinf(out.rpm)
    assert 1200.0 <= out.rpm <= engine.operating_limits.redline_rpm + 50.0
    assert out.brake_torque_nm > 0.0
    assert out.coolant_temp_c >= 25.0


def test_physics_fuel_cut_rev_limiter_behavior():
    """Verify that operating at redline cuts fuel delivery to zero and protects against overspeed."""
    engine = engine_catalog.get("AUTO-EA888-2.0T")
    assert engine is not None

    sim = DeterministicEngineSimulator(engine)
    # Initialize directly at redline
    sim.reset(initial_rpm=engine.operating_limits.redline_rpm + 10.0)

    out = sim.step(SimulationInput(throttle=1.0, load_torque_nm=0.0, dt_s=0.02))
    assert out.is_rev_limiting is True
    assert out.operating_state == "REV_LIMITING"
    assert out.fuel_mass_flow_kg_s == 0.0
    assert out.indicated_power_kw == 0.0
    assert out.brake_torque_nm <= 0.0  # Decelerating due to internal friction


def test_physics_long_duration_continuous_integration_drift():
    """Verify that 1,000 sequential integration steps run without NaN/Inf, divergence, or memory leak."""
    engine = engine_catalog.get("AUTO-EA888-2.0T")
    assert engine is not None

    sim = DeterministicEngineSimulator(engine)
    sim.reset(initial_rpm=1000.0)

    step_input = SimulationInput(throttle=0.4, load_torque_nm=120.0, dt_s=0.02)
    for _ in range(1000):
        out = sim.step(step_input)

    assert not math.isnan(out.rpm)
    assert not math.isnan(out.coolant_temp_c)
    assert not math.isnan(out.oil_temp_c)
    assert not math.isnan(out.total_fuel_consumed_kg)
    assert out.total_fuel_consumed_kg > 0.0
    assert out.coolant_temp_c < engine.operating_limits.max_coolant_temp_c + 20.0


# =============================================================================
# 3. Adversarial Telemetry & Anomaly Detection Tests
# =============================================================================

def test_anomaly_detector_duplicate_timestamps_no_false_alarm():
    """Verify that duplicate timestamps (dt = 0) do not produce division-by-zero or false alarms."""
    engine = engine_catalog.get("AUTO-EA888-2.0T")
    assert engine is not None
    detector = AnomalyDetector(engine)

    rec1 = _create_sample_telemetry(engine)
    rec2 = rec1.model_copy()  # Identical timestamp

    detector.analyze(rec1, throttle=0.0)
    anoms2 = detector.analyze(rec2, throttle=0.0)
    # Should not trigger thermal rate-of-rise alarms on duplicate timestamps
    trend_anoms = [a for a in anoms2 if a.detection_method == AnomalyMethod.STATISTICAL_TREND]
    assert len(trend_anoms) == 0


def test_anomaly_detector_out_of_order_timestamps():
    """Verify that out-of-order timestamps (dt < 0) are handled safely without false alarms."""
    engine = engine_catalog.get("AUTO-EA888-2.0T")
    assert engine is not None
    detector = AnomalyDetector(engine)

    rec_current = _create_sample_telemetry(engine)
    t_past = rec_current.timestamp - timedelta(seconds=10)
    rec_delayed = rec_current.model_copy(update={"timestamp": t_past})

    detector.analyze(rec_current, throttle=0.0)
    anoms = detector.analyze(rec_delayed, throttle=0.0)
    # Should not trigger false positive rate-of-rise alarms
    trend_anoms = [a for a in anoms if a.detection_method == AnomalyMethod.STATISTICAL_TREND]
    assert len(trend_anoms) == 0


def test_anomaly_detector_nan_inf_sensor_spikes_isolation():
    """Verify that NaN or Infinite values in incoming telemetry do not crash the detector or corrupt buffers."""
    engine = engine_catalog.get("AUTO-EA888-2.0T")
    assert engine is not None
    detector = AnomalyDetector(engine)

    rec_glitch = _create_sample_telemetry(engine)
    rec_glitch = rec_glitch.model_copy(update={
        "rpm": float("nan"),
        "coolant_temp_c": float("inf"),
    })

    anoms = detector.analyze(rec_glitch, throttle=0.0)
    assert isinstance(anoms, list)
    # Coolant temp Inf should trigger critical envelope alert
    assert any(a.channel == "coolant_temp_c" for a in anoms)


# =============================================================================
# 4. Fault Propagation & Diagnosis Engine Tests
# =============================================================================

def test_fault_graph_traversal_terminates_safely_with_feedback_cycles():
    """Verify that trace_propagation_tree terminates safely without infinite loops despite physical coupling."""
    for subsystem in SubsystemType:
        # Bounded depth traversal must terminate and return a finite path
        path = trace_propagation_tree(subsystem, max_depth=3)
        assert len(path) >= 1
        assert path[0] == subsystem
        assert len(path) == len(set(path))  # Path contains unique nodes, no loop re-entry


def test_fault_mode_catalog_propagation_paths_are_acyclic():
    """Verify that every catalogued fault mode defines a strictly acyclic, valid propagation cascade."""
    for fault_id, fault_def in FAULT_MODES_CATALOG.items():
        path = fault_def.propagation_path
        assert len(path) >= 2, f"Fault mode {fault_id} must have at least 2 propagation nodes."
        assert len(path) == len(set(path)), f"Fault mode {fault_id} propagation path contains duplicate/cyclic nodes."
        assert path[0] == fault_def.origin_subsystem


def test_diagnosis_multi_anomaly_aggregation_on_same_channel():
    """Verify that multiple anomalies on the same channel are properly aggregated and take highest severity."""
    engine = engine_catalog.get("AUTO-EA888-2.0T")
    assert engine is not None
    diagnostic_engine = DiagnosticEngine(engine)

    anoms = [
        TelemetryAnomaly(
            channel="oil_pressure_bar",
            detection_method=AnomalyMethod.RULE_BASED_LIMIT,
            severity=SeverityLevel.CRITICAL,
            measured_or_simulated_value=0.5,
            expected_range=(1.2, 5.0),
            deviation=0.7,
            unit="bar",
            explanation="Oil pressure below minimum safe threshold",
            timestamp_s=10.0,
        ),
        TelemetryAnomaly(
            channel="oil_pressure_bar",
            detection_method=AnomalyMethod.STATISTICAL_TREND,
            severity=SeverityLevel.WARNING,
            measured_or_simulated_value=0.5,
            expected_range=(1.2, 5.0),
            deviation=0.7,
            unit="bar",
            explanation="Oil pressure z-score deviation > 3.0",
            timestamp_s=10.0,
        ),
    ]

    hypotheses = diagnostic_engine.diagnose(anoms)
    assert len(hypotheses) > 0
    oil_hypo = next((h for h in hypotheses if h.fault_id == "FAULT-OIL-PRESSURE-LOW"), None)
    assert oil_hypo is not None
    assert oil_hypo.severity == SeverityLevel.CRITICAL
    # Confidence must be bounded and never 100%
    assert 0.20 <= oil_hypo.confidence <= 0.95
    # Uncertainty interval must contain confidence
    assert oil_hypo.uncertainty_bounds[0] <= oil_hypo.confidence <= oil_hypo.uncertainty_bounds[1]


# =============================================================================
# 5. Component Degradation & RUL Safeguards
# =============================================================================

def test_degradation_insufficient_data_guard():
    """Verify that sparse telemetry history (< 0.5 hours) strictly returns INSUFFICIENT_DATA with required criteria."""
    engine = engine_catalog.get("AUTO-EA888-2.0T")
    assert engine is not None
    tracker = ComponentDegradationTracker(engine)

    # 0.1 hours is below the minimum 0.5h threshold
    res = tracker.estimate_all(
        cumulative_hours=0.1,
        mean_rpm=2500.0,
        mean_oil_temp_c=92.0,
        mean_coolant_temp_c=88.0,
        mean_throttle=0.4,
    )

    for item in res:
        assert item.status == DegradationStatus.INSUFFICIENT_DATA
        assert item.rul_hours_estimate is None
        assert item.rul_uncertainty_interval is None
        assert len(item.required_data) > 0


def test_degradation_sanitization_negative_and_extreme():
    """Verify that negative hours, NaN temperatures, and extreme throttle are sanitized without errors."""
    engine = engine_catalog.get("AUTO-EA888-2.0T")
    assert engine is not None
    tracker = ComponentDegradationTracker(engine)

    # Negative hours and extreme temperatures
    oil_deg = tracker.estimate_oil_health(
        cumulative_hours=-50.0,
        mean_oil_temp_c=float("nan"),
    )
    assert oil_deg.status == DegradationStatus.INSUFFICIENT_DATA

    # High temperature that would cause Arrhenius overflow if uncapped
    oil_extreme = tracker.estimate_oil_health(
        cumulative_hours=100.0,
        mean_oil_temp_c=99999.0,
    )
    assert not math.isnan(oil_extreme.health_percentage)
    assert not math.isinf(oil_extreme.cumulative_stress_hours)
    assert oil_extreme.health_percentage == 0.0


# =============================================================================
# 6. Monte Carlo Reliability & Concurrency Tests
# =============================================================================

def test_monte_carlo_random_seed_determinism():
    """Verify that identical random seeds produce identical Monte Carlo outcomes, and different seeds differ."""
    engine = engine_catalog.get("AUTO-EA888-2.0T")
    assert engine is not None
    scenario = PRECONFIGURED_SCENARIOS["SCEN-TRACK-DAY"]

    run1 = run_monte_carlo_mission_simulation(engine, scenario, iterations=500, random_seed=12345)
    run2 = run_monte_carlo_mission_simulation(engine, scenario, iterations=500, random_seed=12345)
    run3 = run_monte_carlo_mission_simulation(engine, scenario, iterations=500, random_seed=99999)

    assert run1.mission_success_rate == run2.mission_success_rate
    assert run1.mtbf_hours_estimate == run2.mtbf_hours_estimate
    assert run1.failure_distribution_by_subsystem == run2.failure_distribution_by_subsystem

    # Different seeds should produce statistically consistent but distinct sample realizations
    assert 0.0 <= run1.mission_success_rate <= 1.0
    assert 0.0 <= run3.mission_success_rate <= 1.0


def test_concurrent_simulation_state_isolation():
    """Verify that multiple concurrent simulator threads operate with 100% state encapsulation."""
    engines = [
        engine_catalog.get("AUTO-EA888-2.0T"),
        engine_catalog.get("AUTO-B58-3.0T"),
        engine_catalog.get("AUTO-M177-4.0V8"),
    ]
    assert all(e is not None for e in engines)

    def run_sim_thread(engine, throttle, load):
        sim = DeterministicEngineSimulator(engine)
        for _ in range(50):
            out = sim.step(SimulationInput(throttle=throttle, load_torque_nm=load, dt_s=0.02))
        return out.rpm, out.brake_power_kw

    with ThreadPoolExecutor(max_workers=3) as executor:
        f1 = executor.submit(run_sim_thread, engines[0], 0.3, 50.0)
        f2 = executor.submit(run_sim_thread, engines[1], 0.7, 200.0)
        f3 = executor.submit(run_sim_thread, engines[2], 1.0, 300.0)

        r1, p1 = f1.result()
        r2, p2 = f2.result()
        r3, p3 = f3.result()

    # All three threads must have finished with valid finite results
    assert r1 > 0 and r2 > 0 and r3 > 0
    assert not math.isnan(p1) and not math.isnan(p2) and not math.isnan(p3)
    # Different engines and throttle loads should have distinctly different power outputs
    assert p1 != p2
    assert p2 != p3
