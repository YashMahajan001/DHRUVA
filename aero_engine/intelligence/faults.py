"""Aero Fault Mode Definitions and Subsystem Mapping for Dhruva Aero.

Defines traceable aerospace failure modes, physical mechanisms,
affected 3D CAD components, and diagnostic evidence signatures.
"""

from __future__ import annotations

from enum import Enum
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field
from aero_engine.catalog.models import AeroCategory


class AeroSeverity(str, Enum):
    INFO = "INFO"
    ADVISORY = "ADVISORY"
    CAUTION = "CAUTION"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"


class AeroFaultDefinition(BaseModel):
    """Formal aerospace failure mode specification."""
    fault_id: str
    name: str
    category: AeroCategory
    affected_component_id: str
    affected_component_name: str
    severity: AeroSeverity
    description: str
    physical_mechanism: str
    symptoms: List[str]
    detection_rule: str
    recommended_action: str


AERO_FAULTS_CATALOG: Dict[str, AeroFaultDefinition] = {
    "FAULT-TURBINE-CREEP": AeroFaultDefinition(
        fault_id="FAULT-TURBINE-CREEP",
        name="High-Pressure Turbine Blade Thermal Creep",
        category=AeroCategory.TURBOFAN,
        affected_component_id="high_pressure_turbine",
        affected_component_name="High-Pressure Turbine (HPT)",
        severity=AeroSeverity.WARNING,
        description="Time-dependent plastic deformation of single-crystal turbine rotor blades under centrifugal stress and elevated temperatures.",
        physical_mechanism="Grain boundary sliding and dislocation climb in nickel-base superalloy blades, causing tip rub against outer shroud.",
        symptoms=[
            "Abnormal rise in Exhaust Gas Temperature (EGT) for commanded thrust",
            "EGT margin erosion (> 45°C deficit)",
            "Increased specific fuel consumption (+6-9%)",
        ],
        detection_rule="EGT_OBSERVED > EGT_MODEL_BASELINE + 40°C AND THRUST_RATIO < 0.96",
        recommended_action="Execute borescope inspection of HPT stage 1 blades; evaluate blade tip clearance and ceramic thermal barrier coating spallation.",
    ),
    "FAULT-COMPRESSOR-STALL": AeroFaultDefinition(
        fault_id="FAULT-COMPRESSOR-STALL",
        name="High-Pressure Compressor Aerodynamic Stall",
        category=AeroCategory.TURBOFAN,
        affected_component_id="high_pressure_compressor",
        affected_component_name="High-Pressure Compressor (HPC)",
        severity=AeroSeverity.CRITICAL,
        description="Breakdown of steady axial airflow through compressor stages, triggering rotating stall or complete compressor surge.",
        physical_mechanism="Boundary layer separation on stator/rotor airfoils during rapid acceleration, severe crosswind, or variable bleed valve failure.",
        symptoms=[
            "Severe high-frequency spool speed oscillations (N2 instability)",
            "Rapid surge in EGT (> 150°C spike in < 2 seconds)",
            "High airframe/engine vibration spike (> 1.5 mils pk-pk)",
            "Audible backfire thud and rapid thrust degradation",
        ],
        detection_rule="d(N2)/dt OSCILLATION > 3.0%/s AND d(EGT)/dt > 50°C/s AND VIBRATION > 1.2 mils",
        recommended_action="Immediately retard throttle toward flight idle; verify Variable Stator Vane (VSV) and Transient Bleed Valve (TBV) scheduling.",
    ),
    "FAULT-OIL-LOSS": AeroFaultDefinition(
        fault_id="FAULT-OIL-LOSS",
        name="Lubrication Scavenge Failure & Pressure Loss",
        category=AeroCategory.TURBOFAN,
        affected_component_id="lubrication_system",
        affected_component_name="Lubrication Oil System & Sump",
        severity=AeroSeverity.CRITICAL,
        description="Sudden decay of main engine bearing oil gallery pressure due to scavenge line rupture, seal leak, or pump cavitation.",
        physical_mechanism="Loss of hydrodynamic oil film across No. 1, 2, and 3 main shaft bearings, leading to dry friction and thermal runaway.",
        symptoms=[
            "Oil gallery pressure drops below FAA minimum limit (< 35 PSI)",
            "Rapid increase in scavenge oil temperature (> 125°C)",
            "Secondary rise in core vibration as bearing tolerance widens",
        ],
        detection_rule="OIL_PRESS < TCDS_MIN_LIMIT (35 PSI) AND d(OIL_PRESS)/dt < -4.0 PSI/s",
        recommended_action="Prepare for precautionary engine shutdown; monitor bearing vibration and divert to nearest divert airfield.",
    ),
    "FAULT-NOZZLE-CLOG": AeroFaultDefinition(
        fault_id="FAULT-NOZZLE-CLOG",
        name="Fuel Injector Nozzle Coking & Streaking",
        category=AeroCategory.TURBOFAN,
        affected_component_id="combustor",
        affected_component_name="Annular Combustor & Fuel Manifold",
        severity=AeroSeverity.CAUTION,
        description="Carbon deposit accumulation in duplex fuel spray nozzles causing distorted spray pattern and localized combustor hot streaks.",
        physical_mechanism="Thermal cracking of hydrocarbon fuel during engine shutdown hot-soak periods, plugging primary metering orifices.",
        symptoms=[
            "Circumferential EGT thermocouple spread deviation",
            "Combustion acoustic noise and light N2 wandering",
            "Slight increase in fuel flow to maintain thrust",
        ],
        detection_rule="EGT_SPREAD_MAX - EGT_SPREAD_MIN > 65°C OR UNEXPLAINED_FUEL_FLOW_RISE > 4%",
        recommended_action="Schedule fuel nozzle ultrasonic cleaning and spray pattern bench testing at next scheduled A-Check.",
    ),
    "FAULT-SENSOR-DRIFT": AeroFaultDefinition(
        fault_id="FAULT-SENSOR-DRIFT",
        name="EGT Thermocouple Harness Calibration Drift",
        category=AeroCategory.TURBOFAN,
        affected_component_id="fadec_sensors",
        affected_component_name="FADEC Dual-Channel Sensor Suite",
        severity=AeroSeverity.ADVISORY,
        description="Degradation of Chromel-Alumel (Type K) thermocouple junctions producing false high or false low temperature signals.",
        physical_mechanism="Oxidation and thermal fatigue of thermocouple harness lead wire resistance across turbine frame.",
        symptoms=[
            "Step change in indicated EGT without corresponding change in fuel flow or N2",
            "Cross-channel discrepancy between FADEC Channel A and Channel B",
        ],
        detection_rule="ABS(EGT_MEASURED - EGT_SYNTHESIZED_MODEL) > 55°C WHILE (N1, N2, FF NOMINAL)",
        recommended_action="Perform loop resistance check of thermocouple harness; verify cold junction compensator calibration.",
    ),
    "FAULT-CHT-DETONATION": AeroFaultDefinition(
        fault_id="FAULT-CHT-DETONATION",
        name="Cylinder Head Thermal Runaway & Detonation",
        category=AeroCategory.PISTON,
        affected_component_id="cylinders",
        affected_component_name="Piston Cylinders & Heads",
        severity=AeroSeverity.CRITICAL,
        description="Spontaneous pre-ignition / detonation shockwaves inside air-cooled combustion chambers causing rapid cylinder head heating.",
        physical_mechanism="Excessive manifold pressure coupled with lean mixture or low fuel octane, resulting in explosive end-gas autoignition.",
        symptoms=[
            "Sharp increase in CHT exceeding 240°C limit",
            "Drop in brake horsepower and rough engine operation",
            "Severe thermal stress on piston crowns and exhaust valves",
        ],
        detection_rule="CHT > 240°C OR d(CHT)/dt > 2.5°C/s AT HIGH_POWER",
        recommended_action="Enrich mixture to Full Rich, lower nose to increase cooling airspeed, and retard throttle to reduce manifold pressure.",
    ),
}
