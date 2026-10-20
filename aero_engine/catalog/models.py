"""Data models and catalog schemas for Dhruva Aero Aircraft Propulsion Systems.

Strictly preserves units, FAA/EASA TCDS certification provenance, and operating limits.
Never fabricates manufacturer ratings or operating limits.
"""

from __future__ import annotations

from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class AeroCategory(str, Enum):
    """Primary aircraft engine propulsion categories per aerospace engineering taxonomy."""
    PISTON = "PISTON"
    TURBOPROP = "TURBOPROP"
    TURBOFAN = "TURBOFAN"
    TURBOJET = "TURBOJET"


class AeroArchitecture(str, Enum):
    """Mechanical and thermodynamic architectural configuration."""
    OPPOSED_4_AIR_COOLED = "OPPOSED_4_AIR_COOLED"
    OPPOSED_6_AIR_COOLED = "OPPOSED_6_AIR_COOLED"
    BOXER_4_TURBOCHARGED = "BOXER_4_TURBOCHARGED"
    REVERSE_FLOW_TURBOPROP = "REVERSE_FLOW_TURBOPROP"
    FIXED_SHAFT_TURBOPROP = "FIXED_SHAFT_TURBOPROP"
    FADEC_AXIAL_CENTRIFUGAL_TURBOPROP = "FADEC_AXIAL_CENTRIFUGAL_TURBOPROP"
    DUAL_SPOOL_HIGH_BYPASS_TURBOFAN = "DUAL_SPOOL_HIGH_BYPASS_TURBOFAN"
    GEARED_TURBOFAN = "GEARED_TURBOFAN"
    SINGLE_SPOOL_AXIAL_TURBOJET = "SINGLE_SPOOL_AXIAL_TURBOJET"


class AeroProvenanceLevel(str, Enum):
    """Formal authority and audit trail level of engineering specifications."""
    FAA_TCDS_VERIFIED = "FAA_TCDS_VERIFIED"
    EASA_TCDS_VERIFIED = "EASA_TCDS_VERIFIED"
    MANUFACTURER_POH_PUBLISHED = "MANUFACTURER_POH_PUBLISHED"
    OFFICIAL_MIL_SPEC = "OFFICIAL_MIL_SPEC"


class AeroProvenanceRecord(BaseModel):
    """Full audit trail documentation for engine data source and certificate."""
    level: AeroProvenanceLevel
    certification_id: str = Field(..., description="FAA/EASA Type Certificate Data Sheet (TCDS) or Document No.")
    issuing_authority: str = Field(..., description="e.g. FAA, EASA, US DoD")
    source_url_or_ref: str = Field(..., description="Direct reference or public repository URL")
    verification_date: str = Field("2026-10-15", description="Audit verification date ISO format")
    notes: Optional[str] = None


class AeroOperatingLimits(BaseModel):
    """Published operational limits. None indicates metric is unavailable or not applicable."""
    # Common lubrication
    min_oil_press_psi: Optional[float] = Field(None, description="Minimum oil pressure [psi]")
    max_oil_press_psi: Optional[float] = Field(None, description="Maximum oil pressure [psi]")
    min_oil_temp_c: Optional[float] = Field(None, description="Minimum oil temperature [deg C]")
    max_oil_temp_c: Optional[float] = Field(None, description="Maximum oil temperature [deg C]")

    # Piston specific
    max_rpm: Optional[float] = Field(None, description="Redline engine RPM [rev/min]")
    idle_rpm: Optional[float] = Field(None, description="Recommended idle RPM [rev/min]")
    max_map_inhg: Optional[float] = Field(None, description="Maximum manifold absolute pressure [inHg]")
    max_cht_c: Optional[float] = Field(None, description="Maximum cylinder head temperature [deg C]")
    max_egt_c: Optional[float] = Field(None, description="Maximum exhaust gas temperature [deg C]")

    # Turbine / Turboprop / Turbofan specific
    max_n1_pct: Optional[float] = Field(None, description="Maximum low-pressure spool speed N1 [%]")
    max_n2_pct: Optional[float] = Field(None, description="Maximum high-pressure spool speed N2 [%]")
    max_ng_pct: Optional[float] = Field(None, description="Maximum gas generator spool speed Ng [%]")
    idle_ng_pct: Optional[float] = Field(None, description="Minimum ground idle gas generator speed Ng [%]")
    max_np_rpm: Optional[float] = Field(None, description="Maximum propeller governor speed Np [RPM]")
    max_itt_c: Optional[float] = Field(None, description="Maximum inter-turbine temperature [deg C]")
    max_turbine_egt_c: Optional[float] = Field(None, description="Takeoff redline exhaust gas temperature [deg C]")
    max_torque_ft_lb: Optional[float] = Field(None, description="Maximum shaft torque limit [ft-lb]")
    max_vibration_ips: Optional[float] = Field(None, description="Maximum allowable vibration velocity [in/s or mils]")


class AeroManufacturerSpecifications(BaseModel):
    """Verified physical dimensions and certified ratings with explicit units."""
    rated_takeoff_power_shp: Optional[float] = Field(None, description="Takeoff shaft horsepower [SHP]")
    rated_takeoff_power_bhp: Optional[float] = Field(None, description="Takeoff brake horsepower [BHP]")
    rated_takeoff_thrust_kn: Optional[float] = Field(None, description="Takeoff thrust rating [kN]")
    rated_takeoff_thrust_lbf: Optional[float] = Field(None, description="Takeoff thrust rating [lbf]")
    continuous_power_shp: Optional[float] = Field(None, description="Maximum continuous SHP [SHP]")
    continuous_power_bhp: Optional[float] = Field(None, description="Maximum continuous BHP [BHP]")
    continuous_thrust_kn: Optional[float] = Field(None, description="Maximum continuous thrust [kN]")
    dry_weight_kg: float = Field(..., description="Engine dry weight [kg]")
    bypass_ratio: Optional[float] = Field(None, description="Bypass ratio for turbofans (cold/core)")
    overall_pressure_ratio: Optional[float] = Field(None, description="Overall compressor pressure ratio OPR")
    specific_fuel_consumption: Optional[str] = Field(None, description="BSFC or TSFC specification with units")
    displacement_liters: Optional[float] = Field(None, description="Displacement for piston engines [liters]")
    fuel_grade: str = Field(..., description="Approved fuel type e.g. Jet-A, Jet-A1, 100LL Avgas, Mogas")


class AeroEngineCatalogEntry(BaseModel):
    """Complete, traceable aircraft engine registry entry."""
    engine_id: str = Field(..., description="Unique engine identifier e.g. 'AERO-CFM-CFM56-7B'")
    manufacturer: str = Field(..., description="Engine OEM e.g. CFM International, Pratt & Whitney Canada")
    model_designation: str = Field(..., description="Commercial/military model designation")
    category: AeroCategory = Field(..., description="Propulsion category")
    architecture: AeroArchitecture = Field(..., description="Architectural classification")
    application_aircraft: List[str] = Field(..., description="Known certified aircraft applications")
    specifications: AeroManufacturerSpecifications = Field(..., description="Verified OEM technical specs")
    operating_limits: AeroOperatingLimits = Field(..., description="Certified operating envelope and limits")
    provenance: AeroProvenanceRecord = Field(..., description="TCDS certificate audit documentation")
    supported_channels: List[str] = Field(..., description="Valid telemetry channels for this category")
    has_3d_model: bool = Field(True, description="Whether 3D digital twin assembly is available")
    model_completeness: str = Field("VERIFIED_CAD_PRIMITIVE", description="Status of 3D digital twin model")
