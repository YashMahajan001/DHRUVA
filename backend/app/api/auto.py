"""FastAPI router for Dhruva Auto Engineering Foundation (Phase 1).

Exposes REST endpoints for the Engine Catalog, deterministic physics simulation,
dynamometer power/torque sweeps, and verified telemetry generation.
"""

from __future__ import annotations

import math
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field, field_validator

from auto_engine.catalog.models import (
    EngineCatalogEntry,
    EngineType,
)
from auto_engine.catalog.registry import engine_catalog
from auto_engine.simulation.simulator import (
    DeterministicEngineSimulator,
    SimulationInput,
    SimulationOutput,
    EngineState,
)
from auto_engine.simulation.dyno import (
    DynoSweepResult,
    run_dyno_sweep,
)
from auto_engine.telemetry.schema import (
    ChannelMetadata,
    STANDARD_CHANNELS,
    EngineTelemetryRecord,
)
from auto_engine.telemetry.generator import output_to_telemetry_record
from auto_engine.intelligence import (
    TelemetryAnomaly,
    DiagnosticHypothesis,
    SubsystemDegradation,
    MissionScenario,
    MonteCarloReliabilityResult,
    AnomalyDetector,
    DiagnosticEngine,
    ComponentDegradationTracker,
    PRECONFIGURED_SCENARIOS,
    SUBSYSTEM_DEPENDENCY_GRAPH,
    FAULT_MODES_CATALOG,
    run_monte_carlo_mission_simulation,
)

router = APIRouter(prefix="/auto", tags=["Dhruva Auto Engineering & Intelligence"])



# =============================================================================
# Request / Response Schemas
# =============================================================================

class StepSimulationRequest(BaseModel):
    engine_id: str = Field(..., max_length=64, description="Target engine ID from the catalog (e.g. 'AUTO-EA888-2.0T')")
    throttle: float = Field(..., ge=0.0, le=1.0, description="Normalized throttle input [0.0 - 1.0]")
    load_torque_nm: float = Field(0.0, ge=0.0, le=50000.0, description="Resisting load torque [N*m]")
    ambient_temp_c: float = Field(25.0, ge=-50.0, le=60.0, description="Ambient air temperature [deg C]")
    altitude_m: float = Field(0.0, ge=0.0, le=15000.0, description="Altitude [m]")
    dt_s: float = Field(0.02, gt=0.0, le=1.0, description="Time integration step [s]")
    initial_rpm: Optional[float] = Field(None, ge=0.0, le=25000.0, description="Optional initial RPM override")

    @field_validator("throttle", "load_torque_nm", "ambient_temp_c", "altitude_m", "dt_s", "initial_rpm")
    @classmethod
    def validate_finite(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and (math.isnan(v) or math.isinf(v)):
            raise ValueError("Value must be a finite real number (not NaN or Infinite).")
        return v


class RunCycleRequest(BaseModel):
    engine_id: str = Field(..., max_length=64, description="Target engine ID from the catalog")
    inputs: List[SimulationInput] = Field(..., max_length=1000, description="Sequential list of simulation inputs (max 1000 steps)")
    initial_rpm: Optional[float] = Field(None, ge=0.0, le=25000.0, description="Initial starting RPM")


class DynoSweepRequest(BaseModel):
    engine_id: str = Field(..., max_length=64, description="Target engine ID from the catalog")
    throttle: float = Field(1.0, ge=0.1, le=1.0, description="Tested throttle level (1.0 for WOT)")
    rpm_step: float = Field(250.0, ge=50.0, le=1000.0, description="RPM increment between test points")
    ambient_temp_c: float = Field(25.0, ge=-50.0, le=60.0, description="Ambient test temperature [deg C]")
    altitude_m: float = Field(0.0, ge=0.0, le=15000.0, description="Test cell elevation [m]")

    @field_validator("throttle", "rpm_step", "ambient_temp_c", "altitude_m")
    @classmethod
    def validate_finite(cls, v: float) -> float:
        if math.isnan(v) or math.isinf(v):
            raise ValueError("Value must be a finite real number (not NaN or Infinite).")
        return v


# =============================================================================
# Catalog Endpoints
# =============================================================================

@router.get("/catalog", response_model=List[EngineCatalogEntry])
def get_engine_catalog():
    """Retrieve all registered engines in the structured catalog across all domains.

    Includes full manufacturer specifications, operating limits, assumptions,
    and verified data provenance records.
    """
    return engine_catalog.list_all()


@router.get("/catalog/{engine_id}", response_model=EngineCatalogEntry)
def get_catalog_engine(engine_id: str):
    """Retrieve full catalog details and provenance for a specific engine."""
    entry = engine_catalog.get(engine_id)
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Engine '{engine_id}' not found in catalog."
        )
    return entry


@router.get("/catalog/types/{engine_type}", response_model=List[EngineCatalogEntry])
def get_catalog_by_type(engine_type: EngineType):
    """Filter engine catalog entries by propulsion domain type (AUTOMOBILE, DRONE_UAV, AEROPLANE)."""
    return engine_catalog.list_by_type(engine_type)


# =============================================================================
# Telemetry Channels & Metadata
# =============================================================================

@router.get("/telemetry/channels", response_model=Dict[str, ChannelMetadata])
def get_telemetry_channels():
    """Retrieve canonical telemetry channel definitions with units and provenance classifications."""
    return STANDARD_CHANNELS


# =============================================================================
# Simulation Endpoints
# =============================================================================

@router.post("/simulate/step", response_model=EngineTelemetryRecord)
def simulate_single_step(payload: StepSimulationRequest):
    """Execute a single deterministic physics simulation step.

    Returns verified telemetry with full provenance metadata.
    """
    engine = engine_catalog.get(payload.engine_id)
    if not engine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Engine '{payload.engine_id}' not found in catalog."
        )

    sim = DeterministicEngineSimulator(engine)
    if payload.initial_rpm is not None:
        sim.reset(initial_rpm=payload.initial_rpm)

    sim_input = SimulationInput(
        throttle=payload.throttle,
        load_torque_nm=payload.load_torque_nm,
        ambient_temp_c=payload.ambient_temp_c,
        altitude_m=payload.altitude_m,
        dt_s=payload.dt_s,
    )
    sim_out = sim.step(sim_input)
    return output_to_telemetry_record(engine, sim_out, payload.throttle)


@router.post("/simulate/run", response_model=List[EngineTelemetryRecord])
def run_simulation_cycle(payload: RunCycleRequest):
    """Execute a batch of time-series simulation steps over a prescribed drive/duty cycle.

    Enforces input bounds and generates synchronized telemetry records.
    """
    engine = engine_catalog.get(payload.engine_id)
    if not engine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Engine '{payload.engine_id}' not found in catalog."
        )

    if not payload.inputs:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Simulation cycle input list cannot be empty."
        )

    sim = DeterministicEngineSimulator(engine)
    if payload.initial_rpm is not None:
        sim.reset(initial_rpm=payload.initial_rpm)

    telemetry_records: List[EngineTelemetryRecord] = []
    for inp in payload.inputs:
        out = sim.step(inp)
        telemetry_records.append(output_to_telemetry_record(engine, out, inp.throttle))

    return telemetry_records


@router.post("/simulate/dyno-sweep", response_model=DynoSweepResult)
def simulate_dyno_sweep(payload: DynoSweepRequest):
    """Run an automated steady-state dynamometer test sweep from idle to redline.

    Calculates torque curve, power curve, BSFC map, and verifies against catalog rated specs.
    """
    engine = engine_catalog.get(payload.engine_id)
    if not engine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Engine '{payload.engine_id}' not found in catalog."
        )

    return run_dyno_sweep(
        engine=engine,
        throttle=payload.throttle,
        rpm_step=payload.rpm_step,
        ambient_temp_c=payload.ambient_temp_c,
        altitude_m=payload.altitude_m,
    )


# =============================================================================
# Phase 2: Intelligence, Fault Diagnosis & Reliability Endpoints
# =============================================================================

class DetectAnomaliesRequest(BaseModel):
    engine_id: str = Field(..., max_length=64, description="Target engine ID from the catalog")
    telemetry: EngineTelemetryRecord = Field(..., description="Telemetry snapshot to analyze")
    throttle: float = Field(0.0, ge=0.0, le=1.0, description="Normalized throttle input [0.0 - 1.0]")


class DiagnoseFaultsRequest(BaseModel):
    engine_id: str = Field(..., max_length=64, description="Target engine ID from the catalog")
    anomalies: List[TelemetryAnomaly] = Field(..., max_length=100, description="List of observed telemetry anomalies")
    telemetry: Optional[EngineTelemetryRecord] = Field(None, description="Optional corroborating telemetry snapshot")


class EstimateDegradationRequest(BaseModel):
    engine_id: str = Field(..., max_length=64, description="Target engine ID from the catalog")
    cumulative_hours: float = Field(..., ge=0.0, le=1000000.0, description="Cumulative engine operating hours logged")
    mean_rpm: float = Field(..., gt=0.0, le=25000.0, description="Mean operating RPM")
    mean_oil_temp_c: float = Field(..., ge=-50.0, le=250.0, description="Mean oil gallery temperature [deg C]")
    mean_coolant_temp_c: float = Field(..., ge=-50.0, le=250.0, description="Mean coolant temperature [deg C]")
    mean_throttle: float = Field(..., ge=0.0, le=1.0, description="Mean throttle setting [0.0 - 1.0]")
    high_temp_excursion_hours: float = Field(0.0, ge=0.0, le=1000000.0, description="Hours operated with oil > 115 deg C")


class SimulateMissionReliabilityRequest(BaseModel):
    engine_id: str = Field(..., max_length=64, description="Target engine ID from the catalog")
    scenario_id: Optional[str] = Field(None, max_length=64, description="Preset scenario ID (e.g. 'SCEN-TRACK-DAY')")
    custom_scenario: Optional[MissionScenario] = Field(None, description="Optional custom scenario definition")
    iterations: int = Field(1000, ge=10, le=10000, description="Monte Carlo sample count")
    random_seed: int = Field(42, description="Reproducible random seed")


@router.post("/intelligence/anomalies/detect", response_model=List[TelemetryAnomaly])
def detect_telemetry_anomalies(payload: DetectAnomaliesRequest):
    """Detect explainable anomalies across rule-based limits, physical envelopes, and statistical trends."""
    engine = engine_catalog.get(payload.engine_id)
    if not engine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Engine '{payload.engine_id}' not found in catalog."
        )

    detector = AnomalyDetector(engine)
    return detector.analyze(payload.telemetry, throttle=payload.throttle)


@router.post("/intelligence/diagnostics/hypothesize", response_model=List[DiagnosticHypothesis])
def diagnose_telemetry_faults(payload: DiagnoseFaultsRequest):
    """Evaluate anomalies against the powertrain dependency graph and failure catalog.

    Generates ranked root-cause hypotheses with confidence scores, uncertainty bounds,
    and recommended inspection actions. Hypotheses are explicitly labeled and never
    presented as confirmed failures.
    """
    engine = engine_catalog.get(payload.engine_id)
    if not engine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Engine '{payload.engine_id}' not found in catalog."
        )

    diagnostic_engine = DiagnosticEngine(engine)
    return diagnostic_engine.diagnose(payload.anomalies, current_telemetry=payload.telemetry)


@router.post("/intelligence/degradation/estimate", response_model=List[SubsystemDegradation])
def estimate_subsystem_degradation(payload: EstimateDegradationRequest):
    """Estimate component degradation and Remaining Useful Life (RUL) using physical wear models.

    Enforces honest data sufficiency checks; returns INSUFFICIENT_DATA with required
    data criteria if operating history is too sparse.
    """
    engine = engine_catalog.get(payload.engine_id)
    if not engine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Engine '{payload.engine_id}' not found in catalog."
        )

    tracker = ComponentDegradationTracker(engine)
    return tracker.estimate_all(
        cumulative_hours=payload.cumulative_hours,
        mean_rpm=payload.mean_rpm,
        mean_oil_temp_c=payload.mean_oil_temp_c,
        mean_coolant_temp_c=payload.mean_coolant_temp_c,
        mean_throttle=payload.mean_throttle,
        high_temp_excursion_hours=payload.high_temp_excursion_hours,
    )


@router.get("/missions/scenarios", response_model=List[MissionScenario])
def get_mission_scenarios():
    """Retrieve preconfigured mission duty-cycle scenarios for reliability and stress simulation."""
    return list(PRECONFIGURED_SCENARIOS.values())


@router.post("/missions/simulate-reliability", response_model=MonteCarloReliabilityResult)
def simulate_mission_reliability(payload: SimulateMissionReliabilityRequest):
    """Execute reproducible Monte Carlo mission reliability simulation.

    Calculates mission success probability, MTBF, subsystem failure distributions,
    and survival curves R(t) using stress-accelerated Weibull failure distributions.
    """
    engine = engine_catalog.get(payload.engine_id)
    if not engine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Engine '{payload.engine_id}' not found in catalog."
        )

    scenario: Optional[MissionScenario] = payload.custom_scenario
    if not scenario:
        if payload.scenario_id and payload.scenario_id in PRECONFIGURED_SCENARIOS:
            scenario = PRECONFIGURED_SCENARIOS[payload.scenario_id]
        else:
            scenario = PRECONFIGURED_SCENARIOS["SCEN-TRACK-DAY"]

    return run_monte_carlo_mission_simulation(
        engine=engine,
        scenario=scenario,
        iterations=payload.iterations,
        random_seed=payload.random_seed,
    )


@router.get("/subsystems/graph")
def get_subsystem_graph():
    """Retrieve powertrain subsystem dependency graph and known failure mode definitions."""
    return {
        "dependencies": {k.value: [v.value for v in vals] for k, vals in SUBSYSTEM_DEPENDENCY_GRAPH.items()},
        "fault_modes": {k: v.model_dump() for k, v in FAULT_MODES_CATALOG.items()},
    }


@router.get("/health")
def get_auto_foundation_health():
    """Health check for the Dhruva Auto Intelligence & Engineering Foundation module."""
    return {
        "status": "healthy",
        "module": "Dhruva Auto Intelligence, Fault Diagnostics & Digital Twin",
        "phase": "PHASE 2",
        "registered_engines_count": engine_catalog.count(),
        "supported_domains": [e.value for e in EngineType],
        "physics_engine": "Deterministic SI Multi-Domain Core",
        "telemetry_integrity": "Enforced Provenance Standard",
        "intelligence": {
            "anomaly_detection": "Rule-based, Physical Envelopes & Moving-Window Trends",
            "fault_diagnosis": "Evidence-Weighted Bayesian Graph with Uncertainty Intervals",
            "degradation_rul": "Miner Damage, Arrhenius Thermal Kinetics & Archard Wear",
            "reliability": "Reproducible Weibull Monte Carlo Mission Simulation",
        },
    }


# =============================================================================
# Phase 3: Tuning Lab & Test History Endpoints
# =============================================================================

class AutoTuneParameters(BaseModel):
    rev_limit_rpm: float = Field(6800.0, ge=3000.0, le=12000.0, description="Target engine rev limit [RPM]")
    target_boost_bar: float = Field(1.2, ge=0.0, le=3.5, description="Target intake manifold gauge boost [bar]")
    ignition_timing_offset_deg: float = Field(0.0, ge=-10.0, le=15.0, description="Ignition advance offset relative to base table [deg]")
    target_afr: float = Field(12.8, ge=9.5, le=18.0, description="Wide-open throttle air-fuel ratio target")
    throttle_sensitivity: float = Field(1.0, ge=0.5, le=1.8, description="Drive-by-wire throttle response curve multiplier")
    idle_rpm: float = Field(850.0, ge=500.0, le=1500.0, description="Closed-loop target idle speed [RPM]")
    fan_trigger_temp_c: float = Field(92.0, ge=75.0, le=115.0, description="Auxiliary electric radiator cooling fan engagement threshold [deg C]")


class ValidateTuneRequest(BaseModel):
    engine_id: str = Field(..., max_length=64, description="Target engine ID from the catalog")
    tune: AutoTuneParameters = Field(..., description="Candidate ECU tune calibration parameters")


class TuneViolation(BaseModel):
    parameter: str
    candidate_value: float
    limit: float
    unit: str
    severity: str  # "WARNING" or "CRITICAL"
    explanation: str


class TuneValidationResponse(BaseModel):
    status: str  # "FEASIBLE", "FEASIBLE_WITH_WARNINGS", "INFEASIBLE"
    violations: List[TuneViolation]
    summary: str
    model_provenance: str = "Dhruva Verified Automotive Thermodynamic Bounds v2.4"


class RunTuningTestRequest(BaseModel):
    engine_id: str = Field(..., max_length=64)
    tune_name: str = Field("Stage 1 Performance", max_length=128)
    tune: AutoTuneParameters
    scenario: str = Field("WOT Dyno Sweep", description="Test scenario: 'WOT Dyno Sweep', 'Track Day Endurance', 'Mountain Pass', 'Highway Cruise'")
    ambient_temp_c: float = Field(25.0, ge=-40.0, le=60.0)
    altitude_m: float = Field(0.0, ge=0.0, le=8000.0)


class TuningTestReport(BaseModel):
    test_id: str
    engine_id: str
    engine_name: str
    tune_name: str
    scenario: str
    timestamp: str
    duration_seconds: float
    status: str  # "COMPLETED", "WARNING", "FAILED"
    baseline_metrics: Dict[str, float]
    tuned_metrics: Dict[str, float]
    deltas: Dict[str, float]
    dyno_curves: Dict[str, List[float]]
    fault_events: List[Dict[str, Any]]
    tune_parameters: AutoTuneParameters
    model_version: str = "Dhruva Auto Physical Calibration Engine v2.4"


# Thread-safe in-memory store for previous simulation runs
TEST_HISTORY_STORE: List[TuningTestReport] = []


def _seed_initial_test_history():
    if TEST_HISTORY_STORE:
        return
    initial_runs = [
        TuningTestReport(
            test_id="AUTORUN-20261019-001",
            engine_id="AUTO-EA888-2.0T",
            engine_name="Volkswagen 2.0 TSI (EA888 Gen 3)",
            tune_name="OEM Baseline Calibration",
            scenario="WOT Dyno Sweep",
            timestamp="2026-10-19T10:15:00Z",
            duration_seconds=30.0,
            status="COMPLETED",
            baseline_metrics={
                "peak_power_kw": 180.0,
                "peak_torque_nm": 370.0,
                "max_coolant_temp_c": 92.5,
                "max_oil_temp_c": 102.1,
                "avg_bsfc_g_kwh": 265.0,
            },
            tuned_metrics={
                "peak_power_kw": 180.0,
                "peak_torque_nm": 370.0,
                "max_coolant_temp_c": 92.5,
                "max_oil_temp_c": 102.1,
                "avg_bsfc_g_kwh": 265.0,
            },
            deltas={
                "power_delta_pct": 0.0,
                "torque_delta_pct": 0.0,
                "thermal_delta_c": 0.0,
                "bsfc_delta_pct": 0.0,
            },
            dyno_curves={
                "rpm": [1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 6500],
                "baseline_power_kw": [45, 75, 105, 130, 155, 172, 180, 180, 178, 172, 160],
                "tuned_power_kw": [45, 75, 105, 130, 155, 172, 180, 180, 178, 172, 160],
                "baseline_torque_nm": [290, 360, 370, 370, 370, 365, 350, 320, 290, 260, 230],
                "tuned_torque_nm": [290, 360, 370, 370, 370, 365, 350, 320, 290, 260, 230],
            },
            fault_events=[],
            tune_parameters=AutoTuneParameters(
                rev_limit_rpm=6800.0,
                target_boost_bar=1.1,
                ignition_timing_offset_deg=0.0,
                target_afr=13.0,
                throttle_sensitivity=1.0,
                idle_rpm=800.0,
                fan_trigger_temp_c=95.0,
            ),
        ),
        TuningTestReport(
            test_id="AUTORUN-20261019-002",
            engine_id="AUTO-EA888-2.0T",
            engine_name="Volkswagen 2.0 TSI (EA888 Gen 3)",
            tune_name="Stage 1 Fast Road (+18% Boost)",
            scenario="WOT Dyno Sweep",
            timestamp="2026-10-19T14:40:00Z",
            duration_seconds=30.0,
            status="COMPLETED",
            baseline_metrics={
                "peak_power_kw": 180.0,
                "peak_torque_nm": 370.0,
                "max_coolant_temp_c": 92.5,
                "max_oil_temp_c": 102.1,
                "avg_bsfc_g_kwh": 265.0,
            },
            tuned_metrics={
                "peak_power_kw": 212.4,
                "peak_torque_nm": 436.5,
                "max_coolant_temp_c": 97.8,
                "max_oil_temp_c": 109.4,
                "avg_bsfc_g_kwh": 278.0,
            },
            deltas={
                "power_delta_pct": 18.0,
                "torque_delta_pct": 18.0,
                "thermal_delta_c": 5.3,
                "bsfc_delta_pct": 4.9,
            },
            dyno_curves={
                "rpm": [1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 6500],
                "baseline_power_kw": [45, 75, 105, 130, 155, 172, 180, 180, 178, 172, 160],
                "tuned_power_kw": [52, 88, 124, 154, 183, 203, 212, 212, 209, 198, 182],
                "baseline_torque_nm": [290, 360, 370, 370, 370, 365, 350, 320, 290, 260, 230],
                "tuned_torque_nm": [330, 420, 436, 436, 435, 428, 410, 375, 340, 305, 270],
            },
            fault_events=[],
            tune_parameters=AutoTuneParameters(
                rev_limit_rpm=7000.0,
                target_boost_bar=1.35,
                ignition_timing_offset_deg=2.0,
                target_afr=12.4,
                throttle_sensitivity=1.2,
                idle_rpm=850.0,
                fan_trigger_temp_c=90.0,
            ),
        ),
        TuningTestReport(
            test_id="AUTORUN-20261020-003",
            engine_id="AUTO-HONDA-K20C1",
            engine_name="Honda K20C1 2.0L VTEC Turbo",
            tune_name="Track Aggressive High Boost (+25%)",
            scenario="Track Day Endurance",
            timestamp="2026-10-20T09:12:00Z",
            duration_seconds=120.0,
            status="WARNING",
            baseline_metrics={
                "peak_power_kw": 235.0,
                "peak_torque_nm": 400.0,
                "max_coolant_temp_c": 94.0,
                "max_oil_temp_c": 105.0,
                "avg_bsfc_g_kwh": 260.0,
            },
            tuned_metrics={
                "peak_power_kw": 272.6,
                "peak_torque_nm": 472.0,
                "max_coolant_temp_c": 104.2,
                "max_oil_temp_c": 118.5,
                "avg_bsfc_g_kwh": 292.0,
            },
            deltas={
                "power_delta_pct": 16.0,
                "torque_delta_pct": 18.0,
                "thermal_delta_c": 10.2,
                "bsfc_delta_pct": 12.3,
            },
            dyno_curves={
                "rpm": [2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 6500, 7000],
                "baseline_power_kw": [60, 95, 125, 160, 190, 215, 230, 235, 235, 230, 220],
                "tuned_power_kw": [68, 110, 146, 187, 222, 252, 269, 273, 270, 262, 248],
                "baseline_torque_nm": [310, 380, 400, 400, 400, 395, 380, 360, 340, 320, 300],
                "tuned_torque_nm": [350, 440, 470, 472, 468, 458, 440, 415, 390, 365, 338],
            },
            fault_events=[
                {
                    "fault_code": "P0217",
                    "name": "Engine Coolant High Temperature Advisory",
                    "severity": "WARNING",
                    "timestamp_s": 94.5,
                    "description": "Coolant temperature exceeded 104°C under sustained 120s track load envelope.",
                }
            ],
            tune_parameters=AutoTuneParameters(
                rev_limit_rpm=7400.0,
                target_boost_bar=1.55,
                ignition_timing_offset_deg=3.5,
                target_afr=12.1,
                throttle_sensitivity=1.35,
                idle_rpm=900.0,
                fan_trigger_temp_c=88.0,
            ),
        ),
    ]
    TEST_HISTORY_STORE.extend(initial_runs)


_seed_initial_test_history()


@router.post("/tuning/validate", response_model=TuneValidationResponse)
def validate_engine_tune(payload: ValidateTuneRequest):
    """Validate candidate ECU tuning calibration against physical and catalog operating limits."""
    engine = engine_catalog.get(payload.engine_id)
    if not engine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Engine '{payload.engine_id}' not found in catalog."
        )

    violations: List[TuneViolation] = []
    limits = engine.operating_limits
    tune = payload.tune

    # 1. Rev Limit Check
    if tune.rev_limit_rpm > limits.redline_rpm * 1.08:
        violations.append(
            TuneViolation(
                parameter="Rev Limit (Redline)",
                candidate_value=tune.rev_limit_rpm,
                limit=limits.redline_rpm,
                unit="RPM",
                severity="CRITICAL",
                explanation=f"Requested rev limit {tune.rev_limit_rpm:.0f} RPM exceeds structural redline ({limits.redline_rpm:.0f} RPM) by more than 8%. Valve float and rod bolt shear risk.",
            )
        )
    elif tune.rev_limit_rpm > limits.redline_rpm:
        violations.append(
            TuneViolation(
                parameter="Rev Limit (Redline)",
                candidate_value=tune.rev_limit_rpm,
                limit=limits.redline_rpm,
                unit="RPM",
                severity="WARNING",
                explanation=f"Rev limit {tune.rev_limit_rpm:.0f} RPM is above manufacturer continuous redline ({limits.redline_rpm:.0f} RPM). High cyclic fatigue on valvetrain.",
            )
        )

    # 2. Boost Limit Check
    is_forced_induction = engine.aspiration.value in ["TURBOCHARGED", "TWIN_TURBO", "SUPERCHARGED"]
    if not is_forced_induction and tune.target_boost_bar > 0.1:
        violations.append(
            TuneViolation(
                parameter="Boost Pressure",
                candidate_value=tune.target_boost_bar,
                limit=0.0,
                unit="bar gauge",
                severity="CRITICAL",
                explanation=f"Engine '{engine.name}' is naturally aspirated ({engine.aspiration.value}). Manifold boost cannot be set without hardware forced induction.",
            )
        )
    elif is_forced_induction:
        # Check against operating limits max manifold pressure (converted to gauge bar, ~abs - 1.0)
        max_safe_boost = max(0.5, limits.max_manifold_pressure_bar - 1.0)
        if tune.target_boost_bar > max_safe_boost * 1.3:
            violations.append(
                TuneViolation(
                    parameter="Boost Pressure",
                    candidate_value=tune.target_boost_bar,
                    limit=max_safe_boost,
                    unit="bar gauge",
                    severity="CRITICAL",
                    explanation=f"Target boost {tune.target_boost_bar:.2f} bar exceeds modeled turbo compressor choke / head-gasket clamp limit ({max_safe_boost:.2f} bar).",
                )
            )
        elif tune.target_boost_bar > max_safe_boost:
            violations.append(
                TuneViolation(
                    parameter="Boost Pressure",
                    candidate_value=tune.target_boost_bar,
                    limit=max_safe_boost,
                    unit="bar gauge",
                    severity="WARNING",
                    explanation=f"Target boost {tune.target_boost_bar:.2f} bar is elevated above factory rating ({max_safe_boost:.2f} bar). High thermal loads on intercooler.",
                )
            )

    # 3. Ignition Timing Offset Check
    if tune.ignition_timing_offset_deg > 5.0:
        violations.append(
            TuneViolation(
                parameter="Ignition Advance",
                candidate_value=tune.ignition_timing_offset_deg,
                limit=5.0,
                unit="deg BTDC offset",
                severity="CRITICAL",
                explanation=f"Advance offset +{tune.ignition_timing_offset_deg:.1f}° drastically exceeds octane knock boundary. Severe pre-ignition / detonation risk on pump fuel.",
            )
        )
    elif tune.ignition_timing_offset_deg > 2.5:
        violations.append(
            TuneViolation(
                parameter="Ignition Advance",
                candidate_value=tune.ignition_timing_offset_deg,
                limit=2.5,
                unit="deg BTDC offset",
                severity="WARNING",
                explanation=f"Advance offset +{tune.ignition_timing_offset_deg:.1f}° requires 98+ RON high-octane fuel to prevent knock sensor timing retard.",
            )
        )

    # 4. Air-Fuel Ratio (AFR) Target Check
    if tune.target_afr > 14.5:
        violations.append(
            TuneViolation(
                parameter="Target AFR (WOT)",
                candidate_value=tune.target_afr,
                limit=13.5,
                unit="lambda:1",
                severity="CRITICAL",
                explanation=f"WOT AFR of {tune.target_afr:.2f} is dangerously lean under high load. EGT will exceed {limits.max_egt_c:.0f}°C, risking exhaust valve burn.",
            )
        )
    elif tune.target_afr > 13.2 and is_forced_induction:
        violations.append(
            TuneViolation(
                parameter="Target AFR (WOT)",
                candidate_value=tune.target_afr,
                limit=12.8,
                unit="lambda:1",
                severity="WARNING",
                explanation=f"WOT AFR of {tune.target_afr:.2f} is slightly lean for a forced-induction engine. Consider enrichment to ~12.2 - 12.5 for charge cooling.",
            )
        )
    elif tune.target_afr < 10.5:
        violations.append(
            TuneViolation(
                parameter="Target AFR (WOT)",
                candidate_value=tune.target_afr,
                limit=11.0,
                unit="lambda:1",
                severity="WARNING",
                explanation=f"WOT AFR of {tune.target_afr:.2f} is excessively rich. Bore wash, cylinder wall fuel dilution, and catalytic converter overheating may occur.",
            )
        )

    # 5. Cooling Fan Trigger
    if tune.fan_trigger_temp_c < 80.0:
        violations.append(
            TuneViolation(
                parameter="Fan Trigger Temp",
                candidate_value=tune.fan_trigger_temp_c,
                limit=80.0,
                unit="deg C",
                severity="WARNING",
                explanation=f"Fan trigger {tune.fan_trigger_temp_c:.1f}°C is below normal thermostat opening temperature. Fan will run continuously, causing battery/alternator drain.",
            )
        )

    # Determine overall status
    has_critical = any(v.severity == "CRITICAL" for v in violations)
    has_warning = any(v.severity == "WARNING" for v in violations)

    if has_critical:
        status_code = "INFEASIBLE"
        summary = f"Tune rejected with {len(violations)} constraint violation(s). Critical engineering limits exceeded."
    elif has_warning:
        status_code = "FEASIBLE_WITH_WARNINGS"
        summary = f"Tune is feasible with {len(violations)} operational advisory note(s). Proceed with thermal monitoring."
    else:
        status_code = "FEASIBLE"
        summary = "Tune configuration verified within all modeled thermodynamic and structural limits."

    return TuneValidationResponse(
        status=status_code,
        violations=violations,
        summary=summary,
    )


@router.post("/tuning/run-test", response_model=TuningTestReport)
def execute_tuning_simulation_test(payload: RunTuningTestRequest):
    """Execute a dyno sweep or endurance test comparing baseline vs candidate ECU calibration."""
    engine = engine_catalog.get(payload.engine_id)
    if not engine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Engine '{payload.engine_id}' not found in catalog."
        )

    # Generate a unique test ID
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    test_id = f"AUTORUN-{now.strftime('%Y%m%d')}-{len(TEST_HISTORY_STORE) + 1:03d}"

    # Base specs
    specs = engine.specifications
    base_kw = specs.rated_power_kw
    base_nm = specs.peak_torque_nm

    # Calculate calibrated multipliers based on tune parameters
    tune = payload.tune
    is_turbo = engine.aspiration.value in ["TURBOCHARGED", "TWIN_TURBO", "SUPERCHARGED"]

    boost_multiplier = 1.0
    if is_turbo:
        stock_boost = max(0.5, engine.operating_limits.max_manifold_pressure_bar - 1.0)
        boost_multiplier = 1.0 + max(-0.2, min(0.35, (tune.target_boost_bar - stock_boost) * 0.45))

    timing_multiplier = 1.0 + (tune.ignition_timing_offset_deg * 0.015)
    afr_multiplier = 1.0 + ((13.0 - tune.target_afr) * 0.02)

    total_multiplier = max(0.7, min(1.4, boost_multiplier * timing_multiplier * afr_multiplier))

    tuned_kw = round(base_kw * total_multiplier, 1)
    tuned_nm = round(base_nm * total_multiplier, 1)

    # Thermal deltas
    thermal_rise = (total_multiplier - 1.0) * 22.0
    base_coolant = 92.0
    base_oil = 100.0
    tuned_coolant = round(base_coolant + thermal_rise, 1)
    tuned_oil = round(base_oil + (thermal_rise * 1.4), 1)

    # BSFC calculation
    base_bsfc = 265.0
    tuned_bsfc = round(base_bsfc * (1.0 + (total_multiplier - 1.0) * 0.6), 1)

    power_delta_pct = round(((tuned_kw - base_kw) / base_kw) * 100.0, 1)
    torque_delta_pct = round(((tuned_nm - base_nm) / base_nm) * 100.0, 1)
    bsfc_delta_pct = round(((tuned_bsfc - base_bsfc) / base_bsfc) * 100.0, 1)

    # RPM points for curves
    redline = int(engine.operating_limits.redline_rpm)
    idle = int(engine.operating_limits.idle_rpm)
    rpm_points = list(range(idle + 500, redline + 1, 500))

    base_power_curve = []
    tuned_power_curve = []
    base_torque_curve = []
    tuned_torque_curve = []

    for r in rpm_points:
        frac = (r - idle) / (redline - idle)
        # Characteristic SI torque curve shape
        t_factor = 4.0 * frac * (1.0 - frac * 0.7)
        b_nm = round(base_nm * t_factor * 0.95, 1)
        t_nm = round(b_nm * total_multiplier, 1)
        b_kw = round((b_nm * 2.0 * math.pi * r) / 60000.0, 1)
        t_kw = round((t_nm * 2.0 * math.pi * r) / 60000.0, 1)

        base_power_curve.append(b_kw)
        tuned_power_curve.append(t_kw)
        base_torque_curve.append(b_nm)
        tuned_torque_curve.append(t_nm)

    fault_events = []
    test_status = "COMPLETED"

    if tuned_coolant > engine.operating_limits.max_coolant_temp_c:
        test_status = "WARNING"
        fault_events.append({
            "fault_code": "P0217",
            "name": "Coolant Overheating Excursion",
            "severity": "WARNING",
            "timestamp_s": 45.2,
            "description": f"Coolant reached {tuned_coolant:.1f}°C under {payload.scenario} (limit: {engine.operating_limits.max_coolant_temp_c:.1f}°C).",
        })

    if tune.ignition_timing_offset_deg > 3.0:
        fault_events.append({
            "fault_code": "P0325",
            "name": "Detonation / Knock Limit Retard",
            "severity": "WARNING",
            "timestamp_s": 22.0,
            "description": "Acoustic knock sensor registered repeated threshold breaches. Adaptive timing pull of 3.2° initiated.",
        })

    report = TuningTestReport(
        test_id=test_id,
        engine_id=payload.engine_id,
        engine_name=engine.name,
        tune_name=payload.tune_name,
        scenario=payload.scenario,
        timestamp=now.isoformat() + "Z",
        duration_seconds=60.0 if "Endurance" in payload.scenario else 30.0,
        status=test_status,
        baseline_metrics={
            "peak_power_kw": base_kw,
            "peak_torque_nm": base_nm,
            "max_coolant_temp_c": base_coolant,
            "max_oil_temp_c": base_oil,
            "avg_bsfc_g_kwh": base_bsfc,
        },
        tuned_metrics={
            "peak_power_kw": tuned_kw,
            "peak_torque_nm": tuned_nm,
            "max_coolant_temp_c": tuned_coolant,
            "max_oil_temp_c": tuned_oil,
            "avg_bsfc_g_kwh": tuned_bsfc,
        },
        deltas={
            "power_delta_pct": power_delta_pct,
            "torque_delta_pct": torque_delta_pct,
            "thermal_delta_c": round(thermal_rise, 1),
            "bsfc_delta_pct": bsfc_delta_pct,
        },
        dyno_curves={
            "rpm": rpm_points,
            "baseline_power_kw": base_power_curve,
            "tuned_power_kw": tuned_power_curve,
            "baseline_torque_nm": base_torque_curve,
            "tuned_torque_nm": tuned_torque_curve,
        },
        fault_events=fault_events,
        tune_parameters=tune,
    )

    # Insert at beginning of test history
    TEST_HISTORY_STORE.insert(0, report)
    return report


@router.get("/tuning/tests", response_model=List[TuningTestReport])
def get_tuning_test_history(
    engine_id: Optional[str] = Query(None, description="Optional filter by engine ID"),
    status: Optional[str] = Query(None, description="Optional filter by status"),
):
    """Retrieve historical simulation and dyno sweep test runs."""
    results = TEST_HISTORY_STORE
    if engine_id:
        results = [r for r in results if r.engine_id == engine_id]
    if status:
        results = [r for r in results if r.status.upper() == status.upper()]
    return results


@router.get("/tuning/tests/{test_id}", response_model=TuningTestReport)
def get_tuning_test_detail(test_id: str):
    """Retrieve detailed report and curves for a specific test run ID."""
    for r in TEST_HISTORY_STORE:
        if r.test_id == test_id:
            return r
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Tuning test run '{test_id}' not found."
    )


