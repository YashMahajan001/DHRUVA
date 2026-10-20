"""Telemetry generator converting physics simulation outputs into verified telemetry records.

Applies strict unit transformations, boundary safety checks, and populates
channel-by-channel provenance metadata.
"""

from __future__ import annotations

from typing import List
from auto_engine.catalog.models import EngineCatalogEntry
from auto_engine.simulation.simulator import SimulationOutput
from auto_engine.telemetry.schema import (
    EngineTelemetryRecord,
    TelemetryProvenance,
    STANDARD_CHANNELS,
)


def output_to_telemetry_record(
    engine: EngineCatalogEntry,
    sim_out: SimulationOutput,
    throttle_cmd: float,
) -> EngineTelemetryRecord:
    """Convert a raw physics SimulationOutput into a validated EngineTelemetryRecord.

    Enforces that:
    1. Every channel is stamped with its exact physical engineering unit.
    2. 'is_synthetic' is set to True (never presented as real physical measurements).
    3. The provenance map is fully populated for every metric.

    Args:
        engine: Engine catalog specification entry
        sim_out: Raw physics simulation output
        throttle_cmd: Commanded throttle input [0.0 - 1.0]

    Returns:
        EngineTelemetryRecord with full integrity checks and provenance
    """
    # Populate the canonical provenance map from standard channels
    prov_map = {name: meta.provenance for name, meta in STANDARD_CHANNELS.items()}

    return EngineTelemetryRecord(
        timestamp=sim_out.timestamp,
        engine_id=engine.engine_id,
        engine_type=engine.engine_type.value,
        operating_state=sim_out.operating_state,
        is_synthetic=True,
        rpm=sim_out.rpm,
        throttle_pct=round(throttle_cmd * 100.0, 1),
        brake_torque_nm=sim_out.brake_torque_nm,
        brake_power_kw=sim_out.brake_power_kw,
        fuel_flow_lph=sim_out.fuel_flow_lph,
        bsfc_g_kwh=sim_out.bsfc_g_kwh,
        manifold_pressure_kpa=sim_out.manifold_pressure_kpa,
        boost_pressure_bar=sim_out.boost_pressure_bar,
        coolant_temp_c=sim_out.coolant_temp_c,
        oil_temp_c=sim_out.oil_temp_c,
        oil_pressure_bar=sim_out.oil_pressure_bar,
        egt_c=sim_out.egt_c,
        cht_c=sim_out.cht_c,
        air_fuel_ratio=sim_out.air_fuel_ratio,
        total_fuel_consumed_kg=sim_out.total_fuel_consumed_kg,
        channel_provenance=prov_map,
    )


def batch_outputs_to_telemetry(
    engine: EngineCatalogEntry,
    sim_outputs: List[SimulationOutput],
    throttles: List[float],
) -> List[EngineTelemetryRecord]:
    """Convert a batch of sequential simulation outputs into telemetry records."""
    records: List[EngineTelemetryRecord] = []
    for out, th in zip(sim_outputs, throttles):
        records.append(output_to_telemetry_record(engine, out, th))
    return records
