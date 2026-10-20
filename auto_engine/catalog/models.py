"""Pydantic models for the structured, extensible engine catalog.

Defines schemas for manufacturer specifications, operating limits,
engineering assumptions, and strict data provenance tracking.
"""

from __future__ import annotations

from enum import Enum
from typing import Dict, List, Optional
from pydantic import BaseModel, Field, ConfigDict


class EngineType(str, Enum):
    AUTOMOBILE = "AUTOMOBILE"
    DRONE_UAV = "DRONE_UAV"
    AEROPLANE = "AEROPLANE"


class AspirationType(str, Enum):
    NATURALLY_ASPIRATED = "NATURALLY_ASPIRATED"
    TURBOCHARGED = "TURBOCHARGED"
    TWIN_TURBOCHARGED = "TWIN_TURBOCHARGED"
    SUPERCHARGED = "SUPERCHARGED"


class CylinderConfig(str, Enum):
    INLINE = "INLINE"
    V_ENGINE = "V_ENGINE"
    BOXER_OPPOSED = "BOXER_OPPOSED"
    ROTARY = "ROTARY"
    TURBINE = "TURBINE"


class FuelType(str, Enum):
    GASOLINE_98_RON = "GASOLINE_98_RON"
    GASOLINE_95_RON = "GASOLINE_95_RON"
    DIESEL_EN590 = "DIESEL_EN590"
    HYBRID_GASOLINE = "HYBRID_GASOLINE"
    AVGAS_100LL = "AVGAS_100LL"
    JET_A1 = "JET_A1"


class ProvenanceLevel(str, Enum):
    """Data provenance classification to strictly distinguish verified manufacturer data
    from engineering estimates or simulation defaults.
    """
    VERIFIED_MANUFACTURER_SPEC = "VERIFIED_MANUFACTURER_SPEC"
    CALCULATED_ENGINEERING_METRIC = "CALCULATED_ENGINEERING_METRIC"
    ESTIMATED_EMPIRICAL_CORRELATION = "ESTIMATED_EMPIRICAL_CORRELATION"
    SYNTHETIC_SIMULATION_DEFAULT = "SYNTHETIC_SIMULATION_DEFAULT"


class ProvenanceRecord(BaseModel):
    """Provenance tracking entry for a parameter or parameter group."""
    parameter_group: str
    level: ProvenanceLevel
    source_citation: str
    notes: Optional[str] = None
    is_verified: bool = False

    model_config = ConfigDict(frozen=True)


class OperatingLimits(BaseModel):
    """Enforced physical and operational envelope limits with explicit engineering units."""
    min_operating_rpm: float = Field(..., ge=0, description="Minimum sustained operating speed [RPM]")
    idle_rpm: float = Field(..., ge=0, description="Governed idle speed [RPM]")
    redline_rpm: float = Field(..., gt=0, description="Hard maximum engine speed cutoff [RPM]")
    max_continuous_rpm: float = Field(..., gt=0, description="Maximum continuous operating speed [RPM]")
    min_oil_temp_c: float = Field(-30.0, description="Minimum oil operating temperature [deg C]")
    max_oil_temp_c: float = Field(135.0, description="Maximum safe oil temperature [deg C]")
    min_oil_pressure_idle_bar: float = Field(0.8, description="Minimum allowable oil pressure at idle [bar]")
    min_oil_pressure_rated_bar: float = Field(2.0, description="Minimum allowable oil pressure at rated RPM [bar]")
    max_oil_pressure_bar: float = Field(7.0, description="Pressure relief valve setpoint [bar]")
    max_coolant_temp_c: float = Field(110.0, description="Maximum allowable coolant temperature [deg C]")
    max_egt_c: float = Field(980.0, description="Maximum exhaust gas temperature [deg C]")
    max_cht_c: Optional[float] = Field(None, description="Maximum cylinder head temperature (aero/air-cooled) [deg C]")
    max_manifold_pressure_bar: float = Field(1.0, description="Maximum allowable absolute manifold pressure [bar]")

    model_config = ConfigDict(frozen=True)


class ManufacturerSpecifications(BaseModel):
    """Official or benchmark mechanical specifications with explicit SI and engineering units."""
    rated_power_kw: float = Field(..., gt=0, description="Maximum rated brake power [kW]")
    rated_power_hp: float = Field(..., gt=0, description="Maximum rated brake power [HP]")
    rated_power_rpm: float = Field(..., gt=0, description="Engine speed at rated power [RPM]")
    peak_torque_nm: float = Field(..., gt=0, description="Maximum brake torque [Nm]")
    peak_torque_rpm_min: float = Field(..., gt=0, description="Lower engine speed bound for peak torque [RPM]")
    peak_torque_rpm_max: float = Field(..., gt=0, description="Upper engine speed bound for peak torque [RPM]")
    displacement_cc: float = Field(..., gt=0, description="Total swept displacement [cm^3]")
    cylinder_count: int = Field(..., gt=0, description="Number of cylinders")
    bore_mm: float = Field(..., gt=0, description="Cylinder bore diameter [mm]")
    stroke_mm: float = Field(..., gt=0, description="Piston stroke length [mm]")
    compression_ratio: float = Field(..., gt=1.0, description="Geometric compression ratio [-]")
    valves_per_cylinder: int = Field(4, ge=2, le=5, description="Number of valves per cylinder")

    model_config = ConfigDict(frozen=True)


class SimulationParameters(BaseModel):
    """Calibrated physical simulation parameters for the deterministic dynamic engine model."""
    rotational_inertia_kg_m2: float = Field(..., gt=0, description="Crankshaft + flywheel + valvetrain inertia [kg*m^2]")
    thermal_capacitance_coolant_j_k: float = Field(45000.0, gt=0, description="Lumped thermal capacitance of coolant circuit [J/K]")
    thermal_capacitance_oil_j_k: float = Field(22000.0, gt=0, description="Lumped thermal capacitance of oil circuit [J/K]")
    radiator_cooling_coeff_w_k: float = Field(480.0, gt=0, description="Radiator heat transfer coefficient per K [W/K]")
    oil_cooler_coeff_w_k: float = Field(160.0, gt=0, description="Oil heat exchanger transfer coefficient [W/K]")
    baseline_bsfc_g_kwh: float = Field(240.0, gt=0, description="Baseline Brake Specific Fuel Consumption at sweet spot [g/(kW*h)]")
    volumetric_efficiency_peak: float = Field(0.92, gt=0, le=1.6, description="Peak volumetric efficiency [-]")
    mechanical_efficiency_nominal: float = Field(0.88, gt=0, le=1.0, description="Nominal mechanical efficiency at rated load [-]")
    turbo_lag_time_constant_s: float = Field(0.35, ge=0, description="First-order turbocharger boost lag time constant [s]")
    max_boost_pressure_bar: float = Field(0.0, ge=0, description="Maximum gauge boost pressure delivered by turbo [bar]")

    model_config = ConfigDict(frozen=True)


class EngineCatalogEntry(BaseModel):
    """Structured, immutable engine entry in the extensible Dhruva Engine Catalog."""
    engine_id: str = Field(..., description="Unique alphanumeric identifier (e.g. 'AUTO-EA888-2.0T')")
    name: str = Field(..., description="Official engine designation name")
    engine_type: EngineType = Field(..., description="Propulsion domain classification")
    manufacturer: str = Field(..., description="Original equipment manufacturer (OEM)")
    model_family: str = Field(..., description="Engine model code / family name")
    cylinder_configuration: CylinderConfig = Field(..., description="Cylinder layout")
    aspiration: AspirationType = Field(..., description="Aspiration type")
    fuel_type: FuelType = Field(..., description="Designated operating fuel")
    fuel_density_kg_l: float = Field(..., gt=0, description="Fuel density [kg/L]")
    fuel_lhv_mj_kg: float = Field(..., gt=0, description="Fuel Lower Heating Value [MJ/kg]")
    specifications: ManufacturerSpecifications
    operating_limits: OperatingLimits
    simulation_parameters: SimulationParameters
    assumptions: List[str] = Field(default_factory=list, description="Explicit engineering assumptions")
    provenance_records: List[ProvenanceRecord] = Field(default_factory=list, description="Data provenance tracking records")

    model_config = ConfigDict(frozen=True)
