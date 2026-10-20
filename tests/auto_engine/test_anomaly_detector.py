"""Automated tests for Explainable Anomaly Detection (Phase 2)."""

from datetime import datetime, timezone
import pytest
from auto_engine.catalog.registry import engine_catalog
from auto_engine.simulation.simulator import DeterministicEngineSimulator, SimulationInput
from auto_engine.telemetry.generator import output_to_telemetry_record
from auto_engine.intelligence.anomaly_detector import AnomalyDetector
from auto_engine.intelligence.models import AnomalyMethod, SeverityLevel


def test_nominal_operation_has_no_critical_anomalies():
    engine = engine_catalog.get("AUTO-EA888-2.0T")
    sim = DeterministicEngineSimulator(engine)
    sim.reset(initial_rpm=2500.0)

    # Run a few steady nominal steps
    inp = SimulationInput(throttle=0.4, load_torque_nm=120.0, dt_s=0.05)
    out = sim.step(inp)
    rec = output_to_telemetry_record(engine, out, inp.throttle)

    detector = AnomalyDetector(engine)
    anomalies = detector.analyze(rec, throttle=inp.throttle)
    # Under nominal conditions, there should be no critical violations
    criticals = [a for a in anomalies if a.severity == SeverityLevel.CRITICAL]
    assert len(criticals) == 0


def test_rule_based_rpm_redline_anomaly():
    engine = engine_catalog.get("AUTO-EA888-2.0T")
    detector = AnomalyDetector(engine)

    sim = DeterministicEngineSimulator(engine)
    out = sim.step(SimulationInput(throttle=0.2, load_torque_nm=0.0, dt_s=0.05))
    rec = output_to_telemetry_record(engine, out, 0.2)

    # Artificially inject over-redline RPM in telemetry snapshot
    rec.rpm = engine.operating_limits.redline_rpm + 250.0

    anomalies = detector.analyze(rec, throttle=0.2)
    rpm_anoms = [a for a in anomalies if a.channel == "rpm"]
    assert len(rpm_anoms) >= 1
    assert rpm_anoms[0].detection_method == AnomalyMethod.RULE_BASED_LIMIT
    assert rpm_anoms[0].severity == SeverityLevel.CRITICAL
    assert "redline" in rpm_anoms[0].explanation.lower()


def test_rule_based_coolant_overheat_anomaly():
    engine = engine_catalog.get("AUTO-EA888-2.0T")
    detector = AnomalyDetector(engine)

    sim = DeterministicEngineSimulator(engine)
    out = sim.step(SimulationInput(throttle=0.2, load_torque_nm=0.0, dt_s=0.05))
    rec = output_to_telemetry_record(engine, out, 0.2)

    rec.coolant_temp_c = engine.operating_limits.max_coolant_temp_c + 12.0
    anomalies = detector.analyze(rec, throttle=0.2)

    temp_anoms = [a for a in anomalies if a.channel == "coolant_temp_c"]
    assert len(temp_anoms) >= 1
    assert temp_anoms[0].detection_method == AnomalyMethod.RULE_BASED_LIMIT
    assert temp_anoms[0].severity == SeverityLevel.CRITICAL


def test_physical_envelope_boost_leak_anomaly():
    engine = engine_catalog.get("AUTO-EA888-2.0T")
    detector = AnomalyDetector(engine)

    sim = DeterministicEngineSimulator(engine)
    sim.reset(initial_rpm=3500.0)
    out = sim.step(SimulationInput(throttle=0.85, load_torque_nm=200.0, dt_s=0.05))
    rec = output_to_telemetry_record(engine, out, 0.85)

    # In a boost leak, MAP is atmospheric despite high throttle and high RPM
    rec.manifold_pressure_kpa = 98.0  # Atmospheric (no boost)

    anomalies = detector.analyze(rec, throttle=0.85)
    map_anoms = [a for a in anomalies if a.channel == "manifold_pressure_kpa"]
    assert len(map_anoms) >= 1
    assert map_anoms[0].detection_method == AnomalyMethod.PHYSICAL_ENVELOPE
    assert "boost leak" in map_anoms[0].explanation.lower()


def test_statistical_trend_thermal_surge_anomaly():
    engine = engine_catalog.get("AUTO-EA888-2.0T")
    detector = AnomalyDetector(engine)

    sim = DeterministicEngineSimulator(engine)
    out1 = sim.step(SimulationInput(throttle=0.2, dt_s=0.05))
    rec1 = output_to_telemetry_record(engine, out1, 0.2)
    rec1.timestamp = datetime.fromtimestamp(10.0, tz=timezone.utc)
    rec1.coolant_temp_c = 90.0
    detector.analyze(rec1, throttle=0.2)

    # Sudden 10 deg C surge in 1 second
    out2 = sim.step(SimulationInput(throttle=0.2, dt_s=0.05))
    rec2 = output_to_telemetry_record(engine, out2, 0.2)
    rec2.timestamp = datetime.fromtimestamp(11.0, tz=timezone.utc)
    rec2.coolant_temp_c = 100.0  # 10 deg C/s rate of rise

    anomalies = detector.analyze(rec2, throttle=0.2)
    trend_anoms = [
        a for a in anomalies
        if a.detection_method == AnomalyMethod.STATISTICAL_TREND and a.channel == "coolant_temp_c"
    ]
    assert len(trend_anoms) >= 1
    assert "thermal surge" in trend_anoms[0].explanation.lower()
