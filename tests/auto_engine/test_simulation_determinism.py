"""Tests for simulation determinism, repeatability, safety bounds, and rev-limiter."""

import pytest
from auto_engine.catalog.registry import engine_catalog
from auto_engine.simulation.simulator import (
    DeterministicEngineSimulator,
    SimulationInput,
)
from auto_engine.simulation.dyno import run_dyno_sweep


def test_simulation_exact_determinism():
    """Verify that identical input sequences produce 100% deterministic, identical outputs."""
    engine = engine_catalog.get("AUTO-EA888-2.0T")
    assert engine is not None

    sim1 = DeterministicEngineSimulator(engine)
    sim2 = DeterministicEngineSimulator(engine)

    inputs = [
        SimulationInput(throttle=0.2, load_torque_nm=30.0, dt_s=0.05),
        SimulationInput(throttle=0.6, load_torque_nm=120.0, dt_s=0.05),
        SimulationInput(throttle=1.0, load_torque_nm=250.0, dt_s=0.05),
        SimulationInput(throttle=0.0, load_torque_nm=50.0, dt_s=0.05),
    ]

    out1 = sim1.run_cycle(inputs)
    out2 = sim2.run_cycle(inputs)

    assert len(out1) == len(out2)
    for o1, o2 in zip(out1, out2):
        assert o1.rpm == o2.rpm
        assert o1.brake_torque_nm == o2.brake_torque_nm
        assert o1.brake_power_kw == o2.brake_power_kw
        assert o1.fuel_flow_lph == o2.fuel_flow_lph
        assert o1.coolant_temp_c == o2.coolant_temp_c
        assert o1.oil_pressure_bar == o2.oil_pressure_bar
        assert o1.operating_state == o2.operating_state


def test_rev_limiter_intervention():
    """WOT without load drives engine to redline, where rev-limiter intervenes."""
    engine = engine_catalog.get("AUTO-EA888-2.0T")
    assert engine is not None
    redline = engine.operating_limits.redline_rpm

    sim = DeterministicEngineSimulator(engine)
    sim.reset(initial_rpm=redline - 200.0)

    # Apply full throttle with zero load for 30 steps
    outputs = []
    for _ in range(30):
        out = sim.step(SimulationInput(throttle=1.0, load_torque_nm=0.0, dt_s=0.05))
        outputs.append(out)

    # Engine must hit rev-limiter and not run away to infinity
    rev_limited_steps = [o for o in outputs if o.is_rev_limiting]
    assert len(rev_limited_steps) > 0
    max_rpm = max(o.rpm for o in outputs)
    assert max_rpm <= redline + 50.0  # Safe rev-limiter ceiling


def test_idle_governor_anti_stall():
    """High resisting load drags engine down, where closed-loop idle governor prevents stall."""
    engine = engine_catalog.get("AUTO-EA888-2.0T")
    assert engine is not None
    idle_rpm = engine.operating_limits.idle_rpm

    sim = DeterministicEngineSimulator(engine)
    sim.reset(initial_rpm=idle_rpm - 150.0)

    # Apply accessory drag (e.g. A/C compressor + alternator: 35 Nm) with zero throttle
    outputs = []
    for _ in range(20):
        out = sim.step(SimulationInput(throttle=0.0, load_torque_nm=35.0, dt_s=0.05))
        outputs.append(out)

    # Engine speed must be preserved by idle governor
    assert any(o.is_idle_governing for o in outputs)
    final_rpm = outputs[-1].rpm
    assert final_rpm >= idle_rpm * 0.70  # Governor maintains stability


def test_dyno_sweep_accuracy():
    """Verify dynamometer sweep calculates peak torque and power within expected correlation."""
    engine = engine_catalog.get("AUTO-EA888-2.0T")
    assert engine is not None

    dyno_res = run_dyno_sweep(engine, throttle=1.0, rpm_step=500.0)
    assert len(dyno_res.points) >= 10

    # Measured peak power and torque should correlate closely with catalog ratings
    assert dyno_res.peak_power_measured_kw > 130.0
    assert dyno_res.peak_torque_measured_nm > 280.0
    assert dyno_res.power_accuracy_percent >= 80.0
    assert dyno_res.torque_accuracy_percent >= 80.0
    assert dyno_res.min_bsfc_g_kwh > 180.0
