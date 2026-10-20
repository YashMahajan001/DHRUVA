"""Automated tests for Powertrain Fault Graph and Diagnostic Engine (Phase 2)."""

import pytest
from auto_engine.catalog.registry import engine_catalog
from auto_engine.intelligence.models import (
    TelemetryAnomaly,
    AnomalyMethod,
    SeverityLevel,
    SubsystemType,
)
from auto_engine.intelligence.fault_graph import (
    FAULT_MODES_CATALOG,
    SUBSYSTEM_DEPENDENCY_GRAPH,
    trace_propagation_tree,
)
from auto_engine.intelligence.diagnosis_engine import DiagnosticEngine


def test_subsystem_dependency_graph_integrity():
    # Verify graph contains core subsystems
    assert SubsystemType.AIR_INDUCTION in SUBSYSTEM_DEPENDENCY_GRAPH
    assert SubsystemType.LUBRICATION in SUBSYSTEM_DEPENDENCY_GRAPH
    assert SubsystemType.COOLING in SUBSYSTEM_DEPENDENCY_GRAPH

    # Test propagation tree traversal
    path = trace_propagation_tree(SubsystemType.COOLING, max_depth=2)
    assert SubsystemType.COOLING in path
    assert len(path) >= 2


def test_diagnostic_engine_identifies_boost_leak_hypothesis():
    engine = engine_catalog.get("AUTO-EA888-2.0T")
    diag_engine = DiagnosticEngine(engine)

    # Anomaly representing low MAP at high load
    anom = TelemetryAnomaly(
        channel="manifold_pressure_kpa",
        detection_method=AnomalyMethod.PHYSICAL_ENVELOPE,
        severity=SeverityLevel.WARNING,
        measured_or_simulated_value=105.0,
        expected_range=(150.0, 220.0),
        deviation=45.0,
        unit="kPa",
        explanation="MAP deficit under high throttle",
        timestamp_s=12.0,
    )

    hypotheses = diag_engine.diagnose([anom])
    assert len(hypotheses) >= 1

    top_hypo = hypotheses[0]
    assert top_hypo.fault_id == "FAULT-BOOST-LEAK"
    assert top_hypo.is_hypothesis is True
    assert 0.0 < top_hypo.confidence < 1.0
    assert len(top_hypo.supporting_evidence) >= 1
    assert len(top_hypo.recommended_inspections) >= 1
    assert SubsystemType.AIR_INDUCTION.value in top_hypo.propagation_path


def test_diagnostic_engine_identifies_thermostat_overheat_hypothesis():
    engine = engine_catalog.get("AUTO-EA888-2.0T")
    diag_engine = DiagnosticEngine(engine)

    anom = TelemetryAnomaly(
        channel="coolant_temp_c",
        detection_method=AnomalyMethod.RULE_BASED_LIMIT,
        severity=SeverityLevel.CRITICAL,
        measured_or_simulated_value=122.0,
        expected_range=(80.0, 110.0),
        deviation=12.0,
        unit="deg C",
        explanation="Coolant temperature critical",
        timestamp_s=15.0,
    )

    hypotheses = diag_engine.diagnose([anom])
    assert len(hypotheses) >= 1

    matched = [h for h in hypotheses if h.fault_id == "FAULT-THERMOSTAT-CLOSED"]
    assert len(matched) == 1
    hypo = matched[0]
    assert hypo.severity == SeverityLevel.CRITICAL
    assert hypo.subsystem == SubsystemType.COOLING
    assert any("thermostat" in rec.lower() for rec in hypo.recommended_inspections)
