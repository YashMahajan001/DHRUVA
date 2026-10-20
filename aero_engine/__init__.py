"""Dhruva Aero Engineering Foundation & Digital Twin Platform.

Comprehensive aircraft engine digital twin, health monitoring, fault analysis,
simulation, and test platform supporting Piston, Turboprop, Turbofan, and Turbojet engines.
"""

__version__ = "1.0.0"

from aero_engine.catalog.models import (
    AeroCategory,
    AeroArchitecture,
    AeroProvenanceLevel,
    AeroProvenanceRecord,
    AeroOperatingLimits,
    AeroManufacturerSpecifications,
    AeroEngineCatalogEntry,
)
from aero_engine.catalog.registry import (
    aero_catalog,
    PISTON_CHANNELS,
    TURBOPROP_CHANNELS,
    TURBOFAN_CHANNELS,
    TURBOJET_CHANNELS,
)
from aero_engine.telemetry.schema import (
    TelemetryProvenance,
    AeroChannelMetadata,
    TelemetrySignal,
    AeroTelemetryRecord,
)
from aero_engine.physics.simulator import AeroEngineSimulator
from aero_engine.intelligence.faults import (
    AeroSeverity,
    AeroFaultDefinition,
    AERO_FAULTS_CATALOG,
)
from aero_engine.intelligence.diagnostics import (
    AeroAnomaly,
    AeroDiagnosticHypothesis,
    AeroComponentHealth,
    AeroDiagnosticReport,
    AeroDiagnosticEngine,
)
from aero_engine.intelligence.scenarios import (
    AeroScenarioStep,
    AeroFlightScenario,
    AERO_PRECONFIGURED_SCENARIOS,
)

__all__ = [
    "AeroCategory",
    "AeroArchitecture",
    "AeroProvenanceLevel",
    "AeroProvenanceRecord",
    "AeroOperatingLimits",
    "AeroManufacturerSpecifications",
    "AeroEngineCatalogEntry",
    "aero_catalog",
    "PISTON_CHANNELS",
    "TURBOPROP_CHANNELS",
    "TURBOFAN_CHANNELS",
    "TURBOJET_CHANNELS",
    "TelemetryProvenance",
    "AeroChannelMetadata",
    "TelemetrySignal",
    "AeroTelemetryRecord",
    "AeroEngineSimulator",
    "AeroSeverity",
    "AeroFaultDefinition",
    "AERO_FAULTS_CATALOG",
    "AeroAnomaly",
    "AeroDiagnosticHypothesis",
    "AeroComponentHealth",
    "AeroDiagnosticReport",
    "AeroDiagnosticEngine",
    "AeroScenarioStep",
    "AeroFlightScenario",
    "AERO_PRECONFIGURED_SCENARIOS",
]
