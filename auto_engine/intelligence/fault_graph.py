"""Powertrain Subsystem Dependency Graph and Fault Propagation Modeling.

Defines component dependencies, propagation cascades, fault modes, and
traceable pathways across aerospace and automotive propulsion subsystems.
"""

from __future__ import annotations

from typing import List, Dict, Set, Optional
from pydantic import BaseModel, Field

from auto_engine.intelligence.models import (
    SubsystemType,
    SeverityLevel,
)


class FaultModeDefinition(BaseModel):
    """Formal definition of a physical failure mode with propagation attributes."""
    fault_id: str
    name: str
    origin_subsystem: SubsystemType
    severity: SeverityLevel
    description: str
    propagation_path: List[SubsystemType]
    primary_symptoms: List[str]
    secondary_symptoms: List[str]
    recommended_inspections: List[str]


# Canonical Subsystem Dependency Graph
# Key -> Subsystems that depend on / receive output from this key
SUBSYSTEM_DEPENDENCY_GRAPH: Dict[SubsystemType, List[SubsystemType]] = {
    SubsystemType.AIR_INDUCTION: [
        SubsystemType.IGNITION_COMBUSTION,
    ],
    SubsystemType.FUEL_SYSTEM: [
        SubsystemType.IGNITION_COMBUSTION,
    ],
    SubsystemType.IGNITION_COMBUSTION: [
        SubsystemType.MECHANICAL_ROTATING,
        SubsystemType.EXHAUST_TURBO,
        SubsystemType.COOLING,
    ],
    SubsystemType.EXHAUST_TURBO: [
        SubsystemType.AIR_INDUCTION,  # Feedback loop: turbine drives compressor providing boost
        SubsystemType.LUBRICATION,    # Turbo bearings rely on engine oil circuit
    ],
    SubsystemType.MECHANICAL_ROTATING: [
        SubsystemType.LUBRICATION,
        SubsystemType.COOLING,        # Drives water pump / mechanical accessories
    ],
    SubsystemType.LUBRICATION: [
        SubsystemType.MECHANICAL_ROTATING,
        SubsystemType.EXHAUST_TURBO,
        SubsystemType.COOLING,        # Oil heat exchanger transfers heat to coolant
    ],
    SubsystemType.COOLING: [
        SubsystemType.IGNITION_COMBUSTION,
        SubsystemType.LUBRICATION,
    ],
}


# Pre-defined Physical Fault Modes with Traceable Propagation Paths
FAULT_MODES_CATALOG: Dict[str, FaultModeDefinition] = {
    "FAULT-BOOST-LEAK": FaultModeDefinition(
        fault_id="FAULT-BOOST-LEAK",
        name="Turbocharger Boost Leak or Wastegate Stuck Open",
        origin_subsystem=SubsystemType.AIR_INDUCTION,
        severity=SeverityLevel.WARNING,
        description="Loss of charge air pressure between turbocharger compressor outlet and intake manifold, or wastegate bypass remaining unseated.",
        propagation_path=[
            SubsystemType.AIR_INDUCTION,
            SubsystemType.IGNITION_COMBUSTION,
            SubsystemType.EXHAUST_TURBO,
        ],
        primary_symptoms=["manifold_pressure_kpa"],
        secondary_symptoms=["brake_power_kw", "brake_torque_nm"],
        recommended_inspections=[
            "Smoke-test charge air plumbing from turbo outlet to intake throttle body.",
            "Verify wastegate actuator diaphragm integrity and vacuum/boost control solenoid duty cycle.",
            "Inspect intercooler end-tank welds for pressure fissures.",
        ],
    ),
    "FAULT-THERMOSTAT-CLOSED": FaultModeDefinition(
        fault_id="FAULT-THERMOSTAT-CLOSED",
        name="Coolant Thermostat Stuck Closed or Radiator Bypass Blockage",
        origin_subsystem=SubsystemType.COOLING,
        severity=SeverityLevel.CRITICAL,
        description="Coolant is prevented from circulating through the external heat exchanger/radiator, causing severe thermal accumulation in the engine block.",
        propagation_path=[
            SubsystemType.COOLING,
            SubsystemType.LUBRICATION,
            SubsystemType.IGNITION_COMBUSTION,
        ],
        primary_symptoms=["coolant_temp_c"],
        secondary_symptoms=["oil_temp_c", "oil_pressure_bar", "oil_pressure_kpa"],
        recommended_inspections=[
            "Check temperature differential between upper and lower radiator hoses using infrared thermometry.",
            "Remove and test thermostat opening temperature in heated water bath (nominal crack open: 82-87°C).",
            "Verify water pump belt tension and impeller cavitation status.",
        ],
    ),
    "FAULT-OIL-PRESSURE-LOW": FaultModeDefinition(
        fault_id="FAULT-OIL-PRESSURE-LOW",
        name="Lubrication Pressure Loss / Oil Pump Relief Bypass / Bearing Clearance",
        origin_subsystem=SubsystemType.LUBRICATION,
        severity=SeverityLevel.CRITICAL,
        description="Loss of hydrodynamic lubricating film pressure due to stuck relief valve, oil pump cavitation, or excessive crankshaft/connecting-rod journal bearing clearance.",
        propagation_path=[
            SubsystemType.LUBRICATION,
            SubsystemType.MECHANICAL_ROTATING,
            SubsystemType.EXHAUST_TURBO,
        ],
        primary_symptoms=["oil_pressure_bar", "oil_pressure_kpa"],
        secondary_symptoms=["oil_temp_c"],
        recommended_inspections=[
            "Verify oil sump level and check for fuel/coolant dilution via spectroscopic viscosity test.",
            "Install calibrated master mechanical gauge at oil gallery test port to confirm electronic sensor reading.",
            "Remove oil filter and inspect pleats for bronze/copper babbit bearing flake debris.",
        ],
    ),
    "FAULT-INJECTOR-RESTRICTION": FaultModeDefinition(
        fault_id="FAULT-INJECTOR-RESTRICTION",
        name="Direct Fuel Injector Restriction / Lean Mixture Excursion",
        origin_subsystem=SubsystemType.FUEL_SYSTEM,
        severity=SeverityLevel.WARNING,
        description="Partial clogging or solenoid lag in fuel injectors resulting in high AFR lean combustion under load and high exhaust gas temperatures.",
        propagation_path=[
            SubsystemType.FUEL_SYSTEM,
            SubsystemType.IGNITION_COMBUSTION,
            SubsystemType.EXHAUST_TURBO,
        ],
        primary_symptoms=["air_fuel_ratio", "fuel_air_equivalence_ratio", "fuel_flow_lph", "fuel_flow_rate_kg_s"],
        secondary_symptoms=["egt_c", "brake_torque_nm"],
        recommended_inspections=[
            "Execute individual cylinder fuel trim balance test.",
            "Verify high-pressure fuel rail sensor reading against commanded pressure map.",
            "Borescope inspect spark plug tips and exhaust valve faces for lean thermal glazing.",
        ],
    ),
    "FAULT-INTERCOOLER-HEAT-SOAK": FaultModeDefinition(
        fault_id="FAULT-INTERCOOLER-HEAT-SOAK",
        name="Charge Air Cooler Heat Soak / Airflow Ingestion Deficit",
        origin_subsystem=SubsystemType.AIR_INDUCTION,
        severity=SeverityLevel.ADVISORY,
        description="Reduced heat transfer across intercooler core under continuous high load or low ambient airflow, resulting in elevated intake temperatures and reduced charge density.",
        propagation_path=[
            SubsystemType.AIR_INDUCTION,
            SubsystemType.IGNITION_COMBUSTION,
        ],
        primary_symptoms=["intake_temp_c"],
        secondary_symptoms=["brake_power_kw"],
        recommended_inspections=[
            "Inspect intercooler external face for debris, mud, or bent cooling fins.",
            "Check electric cooling fan or duct shutter operation.",
        ],
    ),
}


def get_subsystem_dependencies(subsystem: SubsystemType) -> List[SubsystemType]:
    """Return all direct downstream subsystems influenced by the given subsystem."""
    return SUBSYSTEM_DEPENDENCY_GRAPH.get(subsystem, [])


def trace_propagation_tree(origin: SubsystemType, max_depth: int = 3) -> List[SubsystemType]:
    """Perform breadth-first traversal of the dependency graph to find downstream cascading paths."""
    visited: Set[SubsystemType] = set()
    queue: List[Tuple[SubsystemType, int]] = [(origin, 0)]
    ordered_path: List[SubsystemType] = [origin]
    visited.add(origin)

    while queue:
        curr, depth = queue.pop(0)
        if depth >= max_depth:
            continue
        for child in SUBSYSTEM_DEPENDENCY_GRAPH.get(curr, []):
            if child not in visited:
                visited.add(child)
                ordered_path.append(child)
                queue.append((child, depth + 1))

    return ordered_path
