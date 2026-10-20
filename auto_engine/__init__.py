"""Dhruva Auto Engineering Foundation (Phase 1).

A physics-based, modular, and extensible engine simulation, catalog registry,
and telemetry integrity framework for multi-domain propulsion systems.
"""

__version__ = "2.0.0"

from auto_engine.catalog.models import (
    EngineType,
    AspirationType,
    CylinderConfig,
    FuelType,
    ProvenanceLevel,
    ProvenanceRecord,
    OperatingLimits,
    ManufacturerSpecifications,
    SimulationParameters,
    EngineCatalogEntry,
)
from auto_engine.catalog.registry import engine_catalog
from auto_engine.simulation.simulator import (
    EngineState,
    SimulationInput,
    SimulationOutput,
    DeterministicEngineSimulator,
)
from auto_engine.simulation.dyno import (
    DynoPoint,
    DynoSweepResult,
    run_dyno_sweep,
)
from auto_engine.telemetry.schema import (
    TelemetryProvenance,
    ChannelMetadata,
    STANDARD_CHANNELS,
    EngineTelemetryRecord,
)
from auto_engine.intelligence import (
    AnomalyMethod,
    SeverityLevel,
    SubsystemType,
    TelemetryAnomaly,
    DiagnosticHypothesis,
    DegradationStatus,
    SubsystemDegradation,
    MissionScenario,
    SurvivalCurvePoint,
    MonteCarloReliabilityResult,
    AnomalyDetector,
    FAULT_MODES_CATALOG,
    SUBSYSTEM_DEPENDENCY_GRAPH,
    FaultModeDefinition,
    DiagnosticEngine,
    ComponentDegradationTracker,
    PRECONFIGURED_SCENARIOS,
    run_monte_carlo_mission_simulation,
)

__all__ = [
    "EngineType",
    "AspirationType",
    "CylinderConfig",
    "FuelType",
    "ProvenanceLevel",
    "ProvenanceRecord",
    "OperatingLimits",
    "ManufacturerSpecifications",
    "SimulationParameters",
    "EngineCatalogEntry",
    "engine_catalog",
    "EngineState",
    "SimulationInput",
    "SimulationOutput",
    "DeterministicEngineSimulator",
    "DynoPoint",
    "DynoSweepResult",
    "run_dyno_sweep",
    "TelemetryProvenance",
    "ChannelMetadata",
    "STANDARD_CHANNELS",
    "EngineTelemetryRecord",
    "AnomalyMethod",
    "SeverityLevel",
    "SubsystemType",
    "TelemetryAnomaly",
    "DiagnosticHypothesis",
    "DegradationStatus",
    "SubsystemDegradation",
    "MissionScenario",
    "SurvivalCurvePoint",
    "MonteCarloReliabilityResult",
    "AnomalyDetector",
    "FAULT_MODES_CATALOG",
    "SUBSYSTEM_DEPENDENCY_GRAPH",
    "FaultModeDefinition",
    "DiagnosticEngine",
    "ComponentDegradationTracker",
    "PRECONFIGURED_SCENARIOS",
    "run_monte_carlo_mission_simulation",
]

