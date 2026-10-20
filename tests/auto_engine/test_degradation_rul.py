"""Automated tests for Component Degradation and RUL Estimation (Phase 2)."""

import pytest
from auto_engine.catalog.registry import engine_catalog
from auto_engine.intelligence.models import DegradationStatus, SubsystemType
from auto_engine.intelligence.degradation_model import ComponentDegradationTracker


def test_insufficient_data_honesty_check():
    """Verify that very short/sparse operating history returns INSUFFICIENT_DATA."""
    engine = engine_catalog.get("AUTO-EA888-2.0T")
    tracker = ComponentDegradationTracker(engine)

    # Only 0.1 hours (6 minutes) of operation logged
    results = tracker.estimate_all(
        cumulative_hours=0.1,
        mean_rpm=2400.0,
        mean_oil_temp_c=90.0,
        mean_coolant_temp_c=90.0,
        mean_throttle=0.3,
    )

    for item in results:
        assert item.status == DegradationStatus.INSUFFICIENT_DATA
        assert item.rul_hours_estimate is None
        assert item.rul_uncertainty_interval is None
        assert len(item.required_data) >= 1


def test_sufficient_data_produces_bounded_rul():
    """Verify that sufficient operating history produces defensible RUL and uncertainty."""
    engine = engine_catalog.get("AUTO-EA888-2.0T")
    tracker = ComponentDegradationTracker(engine)

    # 120 hours of operation logged
    results = tracker.estimate_all(
        cumulative_hours=120.0,
        mean_rpm=3200.0,
        mean_oil_temp_c=98.0,
        mean_coolant_temp_c=92.0,
        mean_throttle=0.55,
    )

    oil_deg = next(r for r in results if r.subsystem == SubsystemType.LUBRICATION)
    assert oil_deg.status == DegradationStatus.SUFFICIENT_DATA
    assert oil_deg.rul_hours_estimate is not None
    assert oil_deg.rul_hours_estimate > 0.0
    assert oil_deg.rul_uncertainty_interval is not None
    low, high = oil_deg.rul_uncertainty_interval
    assert low < oil_deg.rul_hours_estimate < high
    assert 0.0 < oil_deg.health_percentage <= 100.0


def test_high_thermal_excursions_accelerate_oil_damage():
    """Verify that operating at elevated temperatures accelerates damage."""
    engine = engine_catalog.get("AUTO-EA888-2.0T")
    tracker = ComponentDegradationTracker(engine)

    # Baseline operating at nominal 90 C
    res_normal = tracker.estimate_oil_health(cumulative_hours=100.0, mean_oil_temp_c=90.0)

    # Hot operation at 115 C
    res_hot = tracker.estimate_oil_health(cumulative_hours=100.0, mean_oil_temp_c=115.0)

    assert res_hot.health_percentage < res_normal.health_percentage
    assert res_hot.rul_hours_estimate < res_normal.rul_hours_estimate
