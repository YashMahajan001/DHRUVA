"""Unit tests for Dhruva Aero multi-category physics simulation and diagnostics."""

import pytest
from aero_engine.catalog.models import AeroCategory
from aero_engine.catalog.registry import aero_catalog
from aero_engine.physics.simulator import AeroEngineSimulator
from aero_engine.intelligence.diagnostics import AeroDiagnosticEngine


def test_turbofan_physics_simulation():
    """Verify CFM56 turbofan accelerates, burns fuel, and produces realistic thrust."""
    engine = aero_catalog.get("AERO-CFM-CFM56-7B")
    assert engine is not None
    sim = AeroEngineSimulator(engine)

    # 1. Idle step
    rec_idle = sim.step(throttle=0.0, ambient_temp_c=15.0, altitude_m=0.0, dt_s=0.1)
    assert rec_idle.n1_pct is not None and rec_idle.n1_pct < 35.0
    assert rec_idle.thrust_kn is not None and rec_idle.thrust_kn < 20.0
    assert rec_idle.data_source.value == "SIMULATED"

    # 2. Acceleration to TOGA (Takeoff power)
    for _ in range(40):
        rec_toga = sim.step(throttle=1.0, ambient_temp_c=15.0, altitude_m=0.0, dt_s=0.1)

    assert rec_toga.n1_pct > 95.0
    assert rec_toga.thrust_kn > 100.0
    assert rec_toga.turbine_egt_c > 750.0
    assert rec_toga.fuel_flow_kgh > 2000.0


def test_piston_physics_simulation():
    """Verify Lycoming IO-360 calculates MAP, CHT, EGT, and BHP."""
    engine = aero_catalog.get("AERO-LYC-IO360")
    assert engine is not None
    sim = AeroEngineSimulator(engine)

    rec = None
    for _ in range(25):
        rec = sim.step(throttle=0.75, ambient_temp_c=20.0, altitude_m=1000.0, dt_s=0.1)

    assert rec is not None
    assert rec.rpm is not None and rec.rpm > 1800.0
    assert rec.map_inhg is not None and 18.0 <= rec.map_inhg <= 30.0
    assert rec.cht_c is not None and 70.0 <= rec.cht_c <= 250.0
    assert rec.power_bhp is not None and rec.power_bhp > 100.0
    assert rec.fuel_flow_gph is not None and rec.fuel_flow_gph > 6.0


def test_turboprop_physics_simulation():
    """Verify PT6A-67P calculates Ng, Np, ITT, Torque, and SHP."""
    engine = aero_catalog.get("AERO-PWC-PT6A-67P")
    assert engine is not None
    sim = AeroEngineSimulator(engine)

    for _ in range(30):
        rec = sim.step(throttle=0.90, ambient_temp_c=10.0, altitude_m=3000.0, dt_s=0.1)

    assert rec.ng_pct is not None and rec.ng_pct > 90.0
    assert rec.np_rpm is not None and rec.np_rpm > 1400.0
    assert rec.itt_c is not None and rec.itt_c > 650.0
    assert rec.shp is not None and rec.shp > 700.0
    assert rec.torque_ft_lb is not None and rec.torque_ft_lb > 2000.0


def test_fault_injection_and_detection():
    """Verify injected compressor stall produces anomalies and attributes to correct component."""
    engine = aero_catalog.get("AERO-CFM-CFM56-7B")
    sim = AeroEngineSimulator(engine)

    # Step with injected compressor stall
    rec_stalled = sim.step(
        throttle=0.95,
        ambient_temp_c=15.0,
        altitude_m=1000.0,
        dt_s=0.1,
        faults={"FAULT_COMPRESSOR_STALL": 1.0},
    )

    diag_engine = AeroDiagnosticEngine(engine)
    report = diag_engine.evaluate(rec_stalled, injected_faults=["FAULT-COMPRESSOR-STALL"])

    assert len(report.hypotheses) >= 1
    stall_hyp = next((h for h in report.hypotheses if h.fault_id == "FAULT-COMPRESSOR-STALL"), None)
    assert stall_hyp is not None
    assert stall_hyp.affected_component_id == "high_pressure_compressor"
    assert stall_hyp.confidence_pct >= 85.0
