"""Canonical telemetry schema with strict unit definitions, operating states, and provenance tracking.

Enforces that every telemetry channel carries clear physical units and provenance
labels (MEASURED, SIMULATED, CALCULATED, ESTIMATED), strictly forbidding synthetic
values from being masqueraded as physical hardware measurements.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional
from pydantic import BaseModel, Field, ConfigDict


class TelemetryProvenance(str, Enum):
    """Provenance origin classification for telemetry data channels."""
    MEASURED = "MEASURED"        # Acquired directly from physical sensor hardware / CAN bus
    SIMULATED = "SIMULATED"      # Integrated dynamically by physics differential equations
    CALCULATED = "CALCULATED"    # Derived algebraically from primary states (e.g. Power = Torque * Speed)
    ESTIMATED = "ESTIMATED"      # Inferred via mathematical observer / state estimator


class ChannelMetadata(BaseModel):
    """Specification of a single telemetry channel including units and provenance."""
    channel_name: str
    unit: str
    provenance: TelemetryProvenance
    description: str
    physical_min: float
    physical_max: float

    model_config = ConfigDict(frozen=True)


# Standard canonical registry of channel specifications
STANDARD_CHANNELS: Dict[str, ChannelMetadata] = {
    "rpm": ChannelMetadata(
        channel_name="rpm",
        unit="RPM",
        provenance=TelemetryProvenance.SIMULATED,
        description="Crankshaft rotational speed",
        physical_min=0.0,
        physical_max=12000.0,
    ),
    "throttle_pct": ChannelMetadata(
        channel_name="throttle_pct",
        unit="%",
        provenance=TelemetryProvenance.MEASURED,
        description="Commanded throttle plate opening percentage",
        physical_min=0.0,
        physical_max=100.0,
    ),
    "brake_torque_nm": ChannelMetadata(
        channel_name="brake_torque_nm",
        unit="N*m",
        provenance=TelemetryProvenance.CALCULATED,
        description="Net engine flywheel output torque",
        physical_min=-150.0,
        physical_max=2000.0,
    ),
    "brake_power_kw": ChannelMetadata(
        channel_name="brake_power_kw",
        unit="kW",
        provenance=TelemetryProvenance.CALCULATED,
        description="Net brake power delivered at the flywheel",
        physical_min=-50.0,
        physical_max=1500.0,
    ),
    "fuel_flow_lph": ChannelMetadata(
        channel_name="fuel_flow_lph",
        unit="L/h",
        provenance=TelemetryProvenance.CALCULATED,
        description="Instantaneous volumetric fuel consumption rate",
        physical_min=0.0,
        physical_max=300.0,
    ),
    "bsfc_g_kwh": ChannelMetadata(
        channel_name="bsfc_g_kwh",
        unit="g/(kW*h)",
        provenance=TelemetryProvenance.CALCULATED,
        description="Brake Specific Fuel Consumption",
        physical_min=150.0,
        physical_max=2500.0,
    ),
    "manifold_pressure_kpa": ChannelMetadata(
        channel_name="manifold_pressure_kpa",
        unit="kPa",
        provenance=TelemetryProvenance.SIMULATED,
        description="Intake manifold absolute air pressure",
        physical_min=10.0,
        physical_max=400.0,
    ),
    "boost_pressure_bar": ChannelMetadata(
        channel_name="boost_pressure_bar",
        unit="bar",
        provenance=TelemetryProvenance.SIMULATED,
        description="Turbocharger gauge boost pressure",
        physical_min=0.0,
        physical_max=3.5,
    ),
    "coolant_temp_c": ChannelMetadata(
        channel_name="coolant_temp_c",
        unit="deg C",
        provenance=TelemetryProvenance.SIMULATED,
        description="Engine coolant circuit temperature",
        physical_min=-40.0,
        physical_max=135.0,
    ),
    "oil_temp_c": ChannelMetadata(
        channel_name="oil_temp_c",
        unit="deg C",
        provenance=TelemetryProvenance.SIMULATED,
        description="Engine oil sump temperature",
        physical_min=-40.0,
        physical_max=160.0,
    ),
    "oil_pressure_bar": ChannelMetadata(
        channel_name="oil_pressure_bar",
        unit="bar",
        provenance=TelemetryProvenance.SIMULATED,
        description="Main gallery regulated oil pressure",
        physical_min=0.0,
        physical_max=10.0,
    ),
    "egt_c": ChannelMetadata(
        channel_name="egt_c",
        unit="deg C",
        provenance=TelemetryProvenance.SIMULATED,
        description="Exhaust Gas Temperature at the collector",
        physical_min=-40.0,
        physical_max=1150.0,
    ),
    "cht_c": ChannelMetadata(
        channel_name="cht_c",
        unit="deg C",
        provenance=TelemetryProvenance.SIMULATED,
        description="Cylinder head metal temperature",
        physical_min=-40.0,
        physical_max=300.0,
    ),
    "air_fuel_ratio": ChannelMetadata(
        channel_name="air_fuel_ratio",
        unit="ratio",
        provenance=TelemetryProvenance.CALCULATED,
        description="Exhaust air-fuel mass ratio",
        physical_min=8.0,
        physical_max=60.0,
    ),
}


class EngineTelemetryRecord(BaseModel):
    """Complete synchronized engine telemetry record with explicit units and provenance tracking."""
    timestamp: datetime = Field(..., description="Sample timestamp in UTC")
    engine_id: str = Field(..., description="Unique engine identifier")
    engine_type: str = Field(..., description="Engine domain classification")
    operating_state: str = Field(..., description="Operational state (IDLE, PART_LOAD, FULL_LOAD, REV_LIMITING, OVERHEAT)")
    is_synthetic: bool = Field(True, description="Strictly true for all simulation-generated telemetry")

    # Primary physical telemetry channels
    rpm: float = Field(..., ge=0.0, description="Crankshaft rotational speed [RPM]")
    throttle_pct: float = Field(..., ge=0.0, le=100.0, description="Throttle position [0 - 100%]")
    brake_torque_nm: float = Field(..., description="Brake torque [N*m]")
    brake_power_kw: float = Field(..., description="Brake power [kW]")
    fuel_flow_lph: float = Field(..., ge=0.0, description="Fuel flow rate [L/h]")
    bsfc_g_kwh: float = Field(..., ge=0.0, description="Brake Specific Fuel Consumption [g/(kW*h)]")
    manifold_pressure_kpa: float = Field(..., gt=0.0, description="Manifold Absolute Pressure [kPa]")
    boost_pressure_bar: float = Field(0.0, ge=0.0, description="Gauge boost pressure [bar]")
    coolant_temp_c: float = Field(..., description="Coolant temperature [deg C]")
    oil_temp_c: float = Field(..., description="Oil temperature [deg C]")
    oil_pressure_bar: float = Field(..., ge=0.0, description="Oil pressure [bar]")
    egt_c: float = Field(..., description="Exhaust gas temperature [deg C]")
    cht_c: float = Field(..., description="Cylinder head temperature [deg C]")
    air_fuel_ratio: float = Field(..., gt=0.0, description="Air-Fuel Ratio [-]")
    total_fuel_consumed_kg: float = Field(0.0, ge=0.0, description="Cumulative fuel consumed [kg]")

    # Explicit channel-level provenance map
    channel_provenance: Dict[str, TelemetryProvenance] = Field(
        default_factory=dict,
        description="Provenance classification for every channel in this record"
    )

    model_config = ConfigDict(extra="forbid")
