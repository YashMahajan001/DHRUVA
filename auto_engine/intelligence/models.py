"""Data models, enums, and schemas for Phase 2 Intelligence & Diagnostics.

Defines schemas for anomaly detection, fault propagation, diagnostic hypotheses,
component degradation tracking, and Monte Carlo mission reliability.
"""

from __future__ import annotations

from enum import Enum
from typing import List, Dict, Optional, Tuple, Any
from pydantic import BaseModel, Field


class AnomalyMethod(str, Enum):
    """Detection methodology used to identify a telemetry anomaly."""
    RULE_BASED_LIMIT = "RULE_BASED_LIMIT"
    PHYSICAL_ENVELOPE = "PHYSICAL_ENVELOPE"
    STATISTICAL_TREND = "STATISTICAL_TREND"


class SeverityLevel(str, Enum):
    """Standardized severity classification."""
    NOMINAL = "NOMINAL"
    ADVISORY = "ADVISORY"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"


class SubsystemType(str, Enum):
    """Propulsion powertrain subsystem categories."""
    AIR_INDUCTION = "AIR_INDUCTION"
    EXHAUST_TURBO = "EXHAUST_TURBO"
    FUEL_SYSTEM = "FUEL_SYSTEM"
    IGNITION_COMBUSTION = "IGNITION_COMBUSTION"
    LUBRICATION = "LUBRICATION"
    COOLING = "COOLING"
    MECHANICAL_ROTATING = "MECHANICAL_ROTATING"


class TelemetryAnomaly(BaseModel):
    """An explainable telemetry anomaly detected in an engine channel."""
    channel: str = Field(..., description="Telemetry channel identifier (e.g. 'manifold_pressure_kpa')")
    detection_method: AnomalyMethod = Field(..., description="Method used to detect the anomaly")
    severity: SeverityLevel = Field(..., description="Severity classification")
    measured_or_simulated_value: float = Field(..., description="Current observed/simulated value")
    expected_range: Tuple[float, float] = Field(..., description="Physical or statistical expected range [min, max]")
    deviation: float = Field(..., description="Magnitude of deviation from nominal range")
    unit: str = Field(..., description="Physical engineering unit")
    explanation: str = Field(..., description="Engineering explanation of why this is anomalous")
    timestamp_s: float = Field(..., description="Simulation or epoch timestamp [s]")


class DiagnosticHypothesis(BaseModel):
    """Traceable root-cause fault hypothesis generated from observed anomalies."""
    hypothesis_id: str = Field(..., description="Unique hypothesis identifier (e.g. 'HYP-BOOST-001')")
    fault_id: str = Field(..., description="Underlying fault mode identifier")
    fault_name: str = Field(..., description="Human-readable fault name")
    subsystem: SubsystemType = Field(..., description="Originating primary subsystem")
    severity: SeverityLevel = Field(..., description="Maximum assessed severity")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score [0.0 - 1.0]")
    uncertainty_bounds: Tuple[float, float] = Field(..., description="Estimated confidence interval [low, high]")
    propagation_path: List[str] = Field(..., description="Ordered list of subsystems through which the fault propagates")
    supporting_evidence: List[str] = Field(..., description="Telemetry indicators supporting this hypothesis")
    refuting_evidence: List[str] = Field(..., description="Indicators that contradict or reduce hypothesis confidence")
    recommended_inspections: List[str] = Field(..., description="Physical maintenance or inspection actions recommended")
    is_hypothesis: bool = Field(True, description="Always true; hypotheses are never presented as confirmed failures")


class DegradationStatus(str, Enum):
    """Data sufficiency status for degradation and RUL estimation."""
    SUFFICIENT_DATA = "SUFFICIENT_DATA"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"


class SubsystemDegradation(BaseModel):
    """Component degradation state and remaining useful life (RUL) estimation."""
    subsystem: SubsystemType = Field(..., description="Target subsystem")
    component_name: str = Field(..., description="Specific component name (e.g. 'Turbocharger Journal Bearings')")
    health_percentage: float = Field(..., ge=0.0, le=100.0, description="Estimated remaining health [0.0 - 100.0%]")
    cumulative_stress_hours: float = Field(..., ge=0.0, description="Cumulative equivalent stress hours logged")
    degradation_metric: str = Field(..., description="Physical wear parameter (e.g. 'Thermal-Mechanical Miner Damage Index')")
    rul_hours_estimate: Optional[float] = Field(None, description="Estimated Remaining Useful Life [hours] (None if insufficient data)")
    rul_uncertainty_interval: Optional[Tuple[float, float]] = Field(None, description="90% confidence interval for RUL [min_hrs, max_hrs]")
    status: DegradationStatus = Field(..., description="Data sufficiency validation status")
    assumptions: List[str] = Field(..., description="Explicit modeling assumptions")
    required_data: List[str] = Field(..., description="Data requirements needed for higher confidence estimation")


class MissionScenario(BaseModel):
    """Configurable mission duty-cycle scenario for reliability and stress simulation."""
    scenario_id: str = Field(..., description="Unique scenario ID")
    name: str = Field(..., description="Descriptive mission name")
    duration_minutes: float = Field(..., gt=0.0, description="Mission duration [minutes]")
    target_rpm: float = Field(..., gt=0.0, description="Nominal operating RPM")
    throttle_mean: float = Field(..., ge=0.0, le=1.0, description="Mean throttle setting [0.0 - 1.0]")
    throttle_std: float = Field(0.05, ge=0.0, description="Standard deviation of throttle variations")
    ambient_temp_c: float = Field(25.0, description="Ambient air temperature [deg C]")
    altitude_m: float = Field(0.0, ge=0.0, description="Target altitude [m]")
    description: str = Field(..., description="Mission operational profile description")


class SurvivalCurvePoint(BaseModel):
    """Discrete time point on the simulated reliability survival curve."""
    time_minutes: float = Field(..., description="Elapsed mission time [minutes]")
    survival_probability: float = Field(..., ge=0.0, le=1.0, description="Estimated survival probability R(t) [0.0 - 1.0]")


class MonteCarloReliabilityResult(BaseModel):
    """Reproducible Monte Carlo reliability simulation output."""
    scenario_id: str = Field(..., description="Mission scenario evaluated")
    scenario_name: str = Field(..., description="Name of the evaluated scenario")
    total_iterations: int = Field(..., gt=0, description="Number of Monte Carlo iterations executed")
    random_seed: int = Field(..., description="Seed used for reproducible pseudo-random generation")
    mission_success_rate: float = Field(..., ge=0.0, le=1.0, description="Simulated mission success probability [0.0 - 1.0]")
    mtbf_hours_estimate: float = Field(..., gt=0.0, description="Simulated Mean Time Between Failures [hours]")
    failure_distribution_by_subsystem: Dict[str, float] = Field(..., description="Percentage of first-failures attributed to each subsystem")
    survival_curve: List[SurvivalCurvePoint] = Field(..., description="Estimated survival probability curve over mission duration")
    sensitivity_factors: Dict[str, str] = Field(..., description="Key sensitivity influences (e.g. ambient temperature, peak boost)")
    provenance_label: str = Field("SIMULATED_RELIABILITY_ESTIMATE", description="Always marked as simulated estimate")
    assumptions_and_limitations: List[str] = Field(..., description="Documented model assumptions and engineering limits")
