"""Tests for the Dhruva Auto Engine Catalog and Data Provenance."""

import pytest
from auto_engine.catalog.models import (
    EngineType,
    ProvenanceLevel,
    EngineCatalogEntry,
    OperatingLimits,
    ManufacturerSpecifications,
    SimulationParameters,
    CylinderConfig,
    AspirationType,
    FuelType,
)
from auto_engine.catalog.registry import engine_catalog, EngineCatalogRegistry


def test_catalog_contains_all_domains():
    """Verify the default catalog contains entries across Automobile, Drone, and Aeroplane domains."""
    all_engines = engine_catalog.list_all()
    assert len(all_engines) >= 6

    automobile_engines = engine_catalog.list_by_type(EngineType.AUTOMOBILE)
    drone_engines = engine_catalog.list_by_type(EngineType.DRONE_UAV)
    aeroplane_engines = engine_catalog.list_by_type(EngineType.AEROPLANE)

    assert len(automobile_engines) >= 3
    assert len(drone_engines) >= 3
    assert len(aeroplane_engines) >= 1


def test_verified_provenance_records():
    """Verify that verified manufacturer specifications have explicit provenance citations."""
    ea888 = engine_catalog.get("AUTO-EA888-2.0T")
    assert ea888 is not None
    assert ea888.specifications.rated_power_kw == 162.0
    assert ea888.specifications.peak_torque_nm == 350.0

    # Ensure provenance records exist and cite official sources
    assert len(ea888.provenance_records) > 0
    verified_records = [r for r in ea888.provenance_records if r.is_verified]
    assert len(verified_records) >= 1
    assert any("Self-Study Programme" in r.source_citation for r in verified_records)


def test_distinction_between_verified_and_estimated_provenance():
    """Ensure estimated parameters are explicitly marked as not verified manufacturer specs."""
    ea888 = engine_catalog.get("AUTO-EA888-2.0T")
    assert ea888 is not None

    estimated = [r for r in ea888.provenance_records if r.level == ProvenanceLevel.ESTIMATED_EMPIRICAL_CORRELATION]
    assert len(estimated) >= 1
    for rec in estimated:
        assert rec.is_verified is False
        assert rec.notes is not None


def test_operating_limits_consistency():
    """Ensure operating limits are physically self-consistent."""
    for engine in engine_catalog.list_all():
        limits = engine.operating_limits
        specs = engine.specifications

        # Redline must be strictly greater than idle and continuous RPM
        assert limits.redline_rpm > limits.idle_rpm
        assert limits.redline_rpm >= limits.max_continuous_rpm
        assert limits.max_oil_pressure_bar > limits.min_oil_pressure_idle_bar
        assert limits.max_coolant_temp_c > 80.0

        # Specifications positivity and geometry
        assert specs.displacement_cc > 0.0
        assert specs.bore_mm > 0.0
        assert specs.stroke_mm > 0.0
        assert specs.compression_ratio > 1.0
        assert specs.rated_power_kw > 0.0
        assert specs.peak_torque_nm > 0.0


def test_catalog_query_normalization():
    """Ensure catalog lookup works with normalized and lowercase identifiers."""
    assert engine_catalog.get("auto-ea888-2.0t") is not None
    assert engine_catalog.get("AUTO_EA888_2.0T") is not None
    assert engine_catalog.get("NONEXISTENT_ENGINE") is None


def test_custom_engine_registration():
    """Ensure new custom engines can be registered cleanly."""
    registry = EngineCatalogRegistry()
    initial_count = registry.count()

    base_engine = registry.get("AUTO-EA888-2.0T")
    assert base_engine is not None

    # Clone with new ID
    custom_entry = EngineCatalogEntry(
        engine_id="CUSTOM-TEST-01",
        name="Custom Test Prototype Engine",
        engine_type=EngineType.AUTOMOBILE,
        manufacturer="Custom Prototype Lab",
        model_family="Prototype",
        cylinder_configuration=CylinderConfig.INLINE,
        aspiration=AspirationType.TURBOCHARGED,
        fuel_type=FuelType.GASOLINE_98_RON,
        fuel_density_kg_l=0.745,
        fuel_lhv_mj_kg=43.5,
        specifications=base_engine.specifications,
        operating_limits=base_engine.operating_limits,
        simulation_parameters=base_engine.simulation_parameters,
        assumptions=["Prototype benchmark assumption"],
        provenance_records=[],
    )

    registry.register(custom_entry)
    assert registry.count() == initial_count + 1
    assert registry.get("CUSTOM-TEST-01") is not None

    # Duplicate registration without overwrite flag raises ValueError
    with pytest.raises(ValueError):
        registry.register(custom_entry, overwrite=False)
