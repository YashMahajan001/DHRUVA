"""Tests for Telemetry Integrity, standard units, and strict provenance labeling."""

from auto_engine.catalog.registry import engine_catalog
from auto_engine.simulation.simulator import DeterministicEngineSimulator, SimulationInput
from auto_engine.telemetry.schema import (
    EngineTelemetryRecord,
    TelemetryProvenance,
    STANDARD_CHANNELS,
)
from auto_engine.telemetry.generator import output_to_telemetry_record


def test_standard_channels_units_and_provenance():
    """Verify that every standard channel has physical units and provenance defined."""
    assert len(STANDARD_CHANNELS) >= 12
    for name, meta in STANDARD_CHANNELS.items():
        assert meta.unit != ""
        assert meta.provenance in (
            TelemetryProvenance.MEASURED,
            TelemetryProvenance.SIMULATED,
            TelemetryProvenance.CALCULATED,
            TelemetryProvenance.ESTIMATED,
        )
        assert meta.physical_max > meta.physical_min


def test_telemetry_record_provenance_integrity():
    """Verify generated telemetry records contain strict provenance labels and is_synthetic=True."""
    engine = engine_catalog.get("AUTO-EA888-2.0T")
    assert engine is not None

    sim = DeterministicEngineSimulator(engine)
    sim_out = sim.step(SimulationInput(throttle=0.75, load_torque_nm=150.0))

    record = output_to_telemetry_record(engine, sim_out, throttle_cmd=0.75)
    assert isinstance(record, EngineTelemetryRecord)

    # Telemetry Integrity: Never claim synthetic simulation values are physical measurements
    assert record.is_synthetic is True

    # Check channels provenance mapping
    assert len(record.channel_provenance) >= 12
    assert record.channel_provenance["rpm"] == TelemetryProvenance.SIMULATED
    assert record.channel_provenance["brake_torque_nm"] == TelemetryProvenance.CALCULATED
    assert record.channel_provenance["brake_power_kw"] == TelemetryProvenance.CALCULATED
    assert record.channel_provenance["coolant_temp_c"] == TelemetryProvenance.SIMULATED

    # Units check
    assert record.throttle_pct == 75.0
    assert record.rpm > 0.0
    assert record.brake_power_kw > 0.0
    assert record.fuel_flow_lph > 0.0
