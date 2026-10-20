"""FastAPI router for Dhruva Aero Aircraft Engine Digital Twin & Health Monitoring.

Exposes REST endpoints for:
- Traceable aircraft engine catalog (Piston, Turboprop, Turbofan, Turbojet)
- Category-isolated physical digital twin simulation
- Real-time diagnostic evaluation, envelope verification, and fault attribution
- Persistent flight scenario simulations and test audit history
"""

from __future__ import annotations

import math
import uuid
import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field, field_validator

from aero_engine import (
    AeroCategory,
    AeroEngineCatalogEntry,
    aero_catalog,
    AeroTelemetryRecord,
    AeroEngineSimulator,
    AeroDiagnosticEngine,
    AeroDiagnosticReport,
    AeroAnomaly,
    AeroDiagnosticHypothesis,
    AeroFlightScenario,
    AERO_PRECONFIGURED_SCENARIOS,
    AERO_FAULTS_CATALOG,
)

router = APIRouter(prefix="/aero", tags=["Dhruva Aero Aircraft Digital Twin"])


# =============================================================================
# Request / Response Schemas
# =============================================================================

class AeroStepRequest(BaseModel):
    engine_id: str = Field(..., max_length=64, description="Target engine ID e.g. 'AERO-CFM-CFM56-7B'")
    throttle: float = Field(..., ge=0.0, le=1.0, description="Commanded throttle setting [0.0 - 1.0]")
    ambient_temp_c: float = Field(15.0, ge=-70.0, le=60.0, description="Ambient air temperature [deg C]")
    altitude_m: float = Field(0.0, ge=0.0, le=25000.0, description="Pressure altitude [m]")
    mach: float = Field(0.0, ge=0.0, le=3.0, description="Flight Mach number")
    operating_state: str = Field("CRUISE", description="IDLE, TAKEOFF, CLIMB, CRUISE, DESCENT, SHUTDOWN, CUSTOM")
    dt_s: float = Field(0.05, gt=0.0, le=2.0, description="Time integration delta [s]")
    injected_faults: Optional[Dict[str, float]] = Field(default_factory=dict, description="Injected fault keys and severity [0.0 - 1.0]")
    initial_value: Optional[float] = Field(None, description="Optional starting speed override (RPM, N1, or Ng)")

    @field_validator("throttle", "ambient_temp_c", "altitude_m", "mach", "dt_s", "initial_value")
    @classmethod
    def validate_finite(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and (math.isnan(v) or math.isinf(v)):
            raise ValueError("Value must be a finite real number (not NaN or Inf).")
        return v


class AeroDiagnosticsRequest(BaseModel):
    engine_id: str = Field(..., max_length=64)
    telemetry: AeroTelemetryRecord
    injected_faults: Optional[List[str]] = Field(default_factory=list)


class AeroRunScenarioRequest(BaseModel):
    engine_id: str = Field(..., max_length=64)
    scenario_id: Optional[str] = Field("SCEN-AERO-CRUISE", max_length=64)
    custom_scenario: Optional[AeroFlightScenario] = None
    injected_faults: Optional[Dict[str, float]] = Field(default_factory=dict)
    time_step_s: float = Field(1.0, ge=0.1, le=5.0)


class AeroTestRunRequest(BaseModel):
    engine_id: str = Field(..., max_length=64)
    test_name: str = Field("Flight Envelope Verification", max_length=128)
    scenario_id: str = Field("SCEN-AERO-TAKEOFF")
    injected_faults: Optional[List[str]] = Field(default_factory=list)
    ambient_temp_c: float = Field(15.0, ge=-60.0, le=55.0)
    altitude_m: float = Field(0.0, ge=0.0, le=20000.0)


class AeroTestReport(BaseModel):
    test_id: str
    engine_id: str
    engine_name: str
    category: AeroCategory
    test_name: str
    scenario_id: str
    timestamp: str
    duration_s: float
    status: str  # "COMPLETED", "ANOMALY_DETECTED", "CRITICAL_EXCEEDANCE"
    faults_injected: List[str]
    faults_detected: List[str]
    health_score_pct: float
    baseline_metrics: Dict[str, float]
    candidate_metrics: Dict[str, float]
    deltas: Dict[str, float]
    telemetry_timeline: List[Dict[str, Any]]
    model_version: str = "Dhruva Aero Multi-Domain Digital Twin v1.0"
    model_assumptions: str


# In-memory store for persistent simulation test runs
AERO_TEST_HISTORY: List[AeroTestReport] = []


def _seed_initial_aero_tests():
    if AERO_TEST_HISTORY:
        return
    initial_reports = [
        AeroTestReport(
            test_id="AERO-TEST-20261019-001",
            engine_id="AERO-CFM-CFM56-7B",
            engine_name="CFM International CFM56-7B27",
            category=AeroCategory.TURBOFAN,
            test_name="Baseline Sea-Level Takeoff Rating Verification",
            scenario_id="SCEN-AERO-TAKEOFF",
            timestamp="2026-10-19T14:32:00Z",
            duration_s=60.0,
            status="COMPLETED",
            faults_injected=[],
            faults_detected=[],
            health_score_pct=99.4,
            baseline_metrics={"thrust_kn": 121.4, "n1_pct": 101.8, "egt_c": 885.0, "fuel_flow_kgh": 3120.0},
            candidate_metrics={"thrust_kn": 121.2, "n1_pct": 101.8, "egt_c": 884.2, "fuel_flow_kgh": 3118.0},
            deltas={"thrust_delta_pct": -0.16, "egt_margin_c": 65.8, "sfc_delta_pct": -0.06},
            telemetry_timeline=[
                {"time_s": 0.0, "n1": 22.0, "n2": 62.0, "egt": 440.0, "thrust": 8.5},
                {"time_s": 15.0, "n1": 101.8, "n2": 102.5, "egt": 884.0, "thrust": 121.2},
                {"time_s": 30.0, "n1": 101.8, "n2": 102.5, "egt": 885.0, "thrust": 121.0},
                {"time_s": 60.0, "n1": 92.0, "n2": 95.0, "egt": 810.0, "thrust": 104.5},
            ],
            model_assumptions="Standard ISA atmosphere, 100% combustion efficiency assumption, zero installation bleed drag.",
        ),
        AeroTestReport(
            test_id="AERO-TEST-20261019-002",
            engine_id="AERO-PWC-PT6A-67P",
            engine_name="Pratt & Whitney Canada PT6A-67P",
            category=AeroCategory.TURBOPROP,
            test_name="Maximum Continuous Climb with Thermal Degradation",
            scenario_id="SCEN-AERO-CLIMB",
            timestamp="2026-10-19T16:15:30Z",
            duration_s=90.0,
            status="ANOMALY_DETECTED",
            faults_injected=["FAULT-TURBINE-CREEP"],
            faults_detected=["FAULT-TURBINE-CREEP"],
            health_score_pct=76.5,
            baseline_metrics={"shp": 1000.0, "itt_c": 740.0, "torque_ft_lb": 3090.0, "fuel_flow_kgh": 245.0},
            candidate_metrics={"shp": 965.0, "itt_c": 808.0, "torque_ft_lb": 2980.0, "fuel_flow_kgh": 262.0},
            deltas={"power_loss_pct": -3.5, "itt_rise_c": 68.0, "fuel_penalty_pct": 6.9},
            telemetry_timeline=[
                {"time_s": 0.0, "ng": 64.0, "np": 1050.0, "itt": 480.0, "shp": 120.0},
                {"time_s": 30.0, "ng": 98.5, "np": 1700.0, "itt": 795.0, "shp": 980.0},
                {"time_s": 60.0, "ng": 99.2, "np": 1700.0, "itt": 808.0, "shp": 965.0},
                {"time_s": 90.0, "ng": 96.0, "np": 1600.0, "itt": 782.0, "shp": 890.0},
            ],
            model_assumptions="Turbine blade clearance modeled with 0.85 mm additional tip leakage, 12:1 pressure ratio.",
        ),
        AeroTestReport(
            test_id="AERO-TEST-20261020-003",
            engine_id="AERO-LYC-IO360",
            engine_name="Lycoming IO-360-A1B6",
            category=AeroCategory.PISTON,
            test_name="High-Altitude Cruise Mixture Lean-of-Peak Evaluation",
            scenario_id="SCEN-AERO-CRUISE",
            timestamp="2026-10-20T10:45:10Z",
            duration_s=120.0,
            status="COMPLETED",
            faults_injected=[],
            faults_detected=[],
            health_score_pct=98.8,
            baseline_metrics={"power_bhp": 150.0, "rpm": 2450.0, "map_inhg": 22.5, "cht_c": 175.0, "fuel_flow_gph": 11.2},
            candidate_metrics={"power_bhp": 142.0, "rpm": 2450.0, "map_inhg": 22.5, "cht_c": 162.0, "fuel_flow_gph": 8.9},
            deltas={"power_delta_pct": -5.3, "cht_delta_c": -13.0, "fuel_savings_pct": -20.5},
            telemetry_timeline=[
                {"time_s": 0.0, "rpm": 2450.0, "map": 22.5, "cht": 175.0, "ff": 11.2},
                {"time_s": 60.0, "rpm": 2450.0, "map": 22.5, "cht": 168.0, "ff": 9.8},
                {"time_s": 120.0, "rpm": 2450.0, "map": 22.5, "cht": 162.0, "ff": 8.9},
            ],
            model_assumptions="Direct drive 1:1 propeller ratio, 100LL fuel, CHT thermal dissipation based on 140 kts airspeed.",
        ),
    ]
    AERO_TEST_HISTORY.extend(initial_reports)


_seed_initial_aero_tests()


# =============================================================================
# Catalog Endpoints
# =============================================================================

@router.get("/catalog", response_model=List[AeroEngineCatalogEntry])
def get_aero_catalog(category: Optional[AeroCategory] = Query(None, description="Optional category filter")):
    """List all certified aircraft engine catalog entries with full TCDS documentation."""
    if category:
        return aero_catalog.list_by_category(category)
    return aero_catalog.list_all()


@router.get("/catalog/{engine_id}", response_model=AeroEngineCatalogEntry)
def get_aero_engine(engine_id: str):
    """Retrieve full specifications and operating limits for an aircraft engine."""
    entry = aero_catalog.get(engine_id)
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Engine '{engine_id}' not found in Aero catalog."
        )
    return entry


# =============================================================================
# Simulation Endpoints
# =============================================================================

@router.post("/simulate/step", response_model=AeroTelemetryRecord)
def simulate_aero_step(payload: AeroStepRequest):
    """Execute a single deterministic time-step for the specified aircraft engine digital twin."""
    engine = aero_catalog.get(payload.engine_id)
    if not engine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Engine '{payload.engine_id}' not found in Aero catalog."
        )

    sim = AeroEngineSimulator(engine)
    if payload.initial_value is not None:
        sim.reset(payload.initial_value)

    return sim.step(
        throttle=payload.throttle,
        ambient_temp_c=payload.ambient_temp_c,
        altitude_m=payload.altitude_m,
        mach=payload.mach,
        operating_state=payload.operating_state,
        dt_s=payload.dt_s,
        faults=payload.injected_faults,
    )


@router.post("/simulate/scenario", response_model=List[AeroTelemetryRecord])
def run_aero_scenario(payload: AeroRunScenarioRequest):
    """Run an entire flight profile scenario and stream chronological telemetry records."""
    engine = aero_catalog.get(payload.engine_id)
    if not engine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Engine '{payload.engine_id}' not found in Aero catalog."
        )

    scenario: Optional[AeroFlightScenario] = payload.custom_scenario
    if not scenario:
        scenario = AERO_PRECONFIGURED_SCENARIOS.get(payload.scenario_id or "SCEN-AERO-CRUISE")
    if not scenario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scenario '{payload.scenario_id}' not found."
        )

    sim = AeroEngineSimulator(engine)
    dt = payload.time_step_s
    total_time = scenario.duration_s
    current_time = 0.0

    telemetry_stream: List[AeroTelemetryRecord] = []

    # Interpolate along waypoints
    waypoints = sorted(scenario.waypoints, key=lambda w: w.time_offset_s)

    while current_time <= total_time:
        # Find active waypoint
        wp = waypoints[0]
        for w in waypoints:
            if current_time >= w.time_offset_s:
                wp = w

        faults = dict(payload.injected_faults or {})
        if wp.injected_fault:
            faults[wp.injected_fault] = 1.0

        record = sim.step(
            throttle=wp.throttle,
            ambient_temp_c=wp.ambient_temp_c,
            altitude_m=wp.altitude_m,
            mach=wp.mach,
            operating_state=wp.phase_label,
            dt_s=dt,
            faults=faults,
        )
        telemetry_stream.append(record)
        current_time += dt

    return telemetry_stream


# =============================================================================
# Diagnostics & Health Evaluation Endpoints
# =============================================================================

@router.post("/diagnostics/evaluate", response_model=AeroDiagnosticReport)
def evaluate_aero_diagnostics(payload: AeroDiagnosticsRequest):
    """Evaluate telemetry frame for envelope violations, physical correlations, and root-cause fault attribution."""
    engine = aero_catalog.get(payload.engine_id)
    if not engine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Engine '{payload.engine_id}' not found in Aero catalog."
        )

    diagnostic_engine = AeroDiagnosticEngine(engine)
    return diagnostic_engine.evaluate(
        telemetry=payload.telemetry,
        injected_faults=payload.injected_faults,
    )


# =============================================================================
# Scenarios Catalog
# =============================================================================

@router.get("/scenarios", response_model=List[AeroFlightScenario])
def get_aero_scenarios():
    """Retrieve preconfigured aerospace flight profile scenarios."""
    return list(AERO_PRECONFIGURED_SCENARIOS.values())


@router.get("/scenarios/{scenario_id}", response_model=AeroFlightScenario)
def get_aero_scenario_by_id(scenario_id: str):
    """Retrieve scenario details by ID."""
    scen = AERO_PRECONFIGURED_SCENARIOS.get(scenario_id)
    if not scen:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scenario '{scenario_id}' not found."
        )
    return scen


# =============================================================================
# Test History & Audit Reports
# =============================================================================

@router.get("/tests", response_model=List[AeroTestReport])
def list_aero_tests():
    """List persistent simulation experiment and diagnostic test audit reports."""
    return AERO_TEST_HISTORY


@router.get("/tests/{test_id}", response_model=AeroTestReport)
def get_aero_test_report(test_id: str):
    """Retrieve detailed test audit report with timeline and delta comparison."""
    for rep in AERO_TEST_HISTORY:
        if rep.test_id == test_id:
            return rep
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Aero test report '{test_id}' not found."
    )


@router.post("/tests/run", response_model=AeroTestReport)
def execute_aero_test_run(payload: AeroTestRunRequest):
    """Execute a complete aerospace test run, evaluate baseline vs candidate, and persist to audit history."""
    engine = aero_catalog.get(payload.engine_id)
    if not engine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Engine '{payload.engine_id}' not found in Aero catalog."
        )

    scenario = AERO_PRECONFIGURED_SCENARIOS.get(payload.scenario_id or "SCEN-AERO-TAKEOFF")
    if not scenario:
        scenario = AERO_PRECONFIGURED_SCENARIOS["SCEN-AERO-TAKEOFF"]

    # 1. Run Baseline (no faults)
    sim_base = AeroEngineSimulator(engine)
    base_records = []
    for wp in scenario.waypoints:
        rec = sim_base.step(
            throttle=wp.throttle,
            ambient_temp_c=payload.ambient_temp_c,
            altitude_m=payload.altitude_m,
            mach=wp.mach,
            dt_s=1.0,
            faults={},
        )
        base_records.append(rec)

    # 2. Run Candidate (with injected faults)
    sim_cand = AeroEngineSimulator(engine)
    faults_dict = {f: 1.0 for f in (payload.injected_faults or [])}
    cand_records = []
    timeline = []

    for wp in scenario.waypoints:
        combined_faults = dict(faults_dict)
        if wp.injected_fault:
            combined_faults[wp.injected_fault] = 1.0

        rec = sim_cand.step(
            throttle=wp.throttle,
            ambient_temp_c=payload.ambient_temp_c,
            altitude_m=payload.altitude_m,
            mach=wp.mach,
            dt_s=1.0,
            faults=combined_faults,
        )
        cand_records.append(rec)

        # Snapshot for report timeline
        point = {
            "time_s": rec.session_time_s,
            "phase": rec.operating_state,
        }
        if engine.category == AeroCategory.TURBOFAN:
            point.update({"n1": rec.n1_pct, "n2": rec.n2_pct, "egt": rec.turbine_egt_c, "thrust_kn": rec.thrust_kn})
        elif engine.category == AeroCategory.TURBOPROP:
            point.update({"ng": rec.ng_pct, "np": rec.np_rpm, "itt": rec.itt_c, "shp": rec.shp})
        elif engine.category == AeroCategory.PISTON:
            point.update({"rpm": rec.rpm, "map": rec.map_inhg, "cht": rec.cht_c, "power": rec.power_bhp})
        else:
            point.update({"n": rec.spool_n_pct, "egt": rec.turbine_egt_c, "thrust_kn": rec.thrust_kn})
        timeline.append(point)

    # 3. Diagnostics on final record
    diag_engine = AeroDiagnosticEngine(engine)
    last_rec = cand_records[-1] if cand_records else base_records[-1]
    diag_rep = diag_engine.evaluate(last_rec, injected_faults=payload.injected_faults)

    # 4. Formulate metrics & deltas
    base_last = base_records[-1]
    cand_last = cand_records[-1]

    baseline_metrics = {}
    candidate_metrics = {}
    deltas = {}

    if engine.category == AeroCategory.TURBOFAN:
        baseline_metrics = {"thrust_kn": base_last.thrust_kn or 0, "n1_pct": base_last.n1_pct or 0, "egt_c": base_last.turbine_egt_c or 0, "fuel_flow_kgh": base_last.fuel_flow_kgh or 0}
        candidate_metrics = {"thrust_kn": cand_last.thrust_kn or 0, "n1_pct": cand_last.n1_pct or 0, "egt_c": cand_last.turbine_egt_c or 0, "fuel_flow_kgh": cand_last.fuel_flow_kgh or 0}
        b_th = max(0.1, base_last.thrust_kn or 1.0)
        deltas = {
            "thrust_delta_pct": round(((cand_last.thrust_kn or 0) - b_th) / b_th * 100.0, 2),
            "egt_delta_c": round((cand_last.turbine_egt_c or 0) - (base_last.turbine_egt_c or 0), 1),
            "ff_delta_pct": round(((cand_last.fuel_flow_kgh or 0) - (base_last.fuel_flow_kgh or 1.0)) / max(1.0, base_last.fuel_flow_kgh or 1.0) * 100.0, 2),
        }
    elif engine.category == AeroCategory.TURBOPROP:
        baseline_metrics = {"shp": base_last.shp or 0, "ng_pct": base_last.ng_pct or 0, "itt_c": base_last.itt_c or 0, "fuel_flow_kgh": base_last.fuel_flow_kgh or 0}
        candidate_metrics = {"shp": cand_last.shp or 0, "ng_pct": cand_last.ng_pct or 0, "itt_c": cand_last.itt_c or 0, "fuel_flow_kgh": cand_last.fuel_flow_kgh or 0}
        b_shp = max(0.1, base_last.shp or 1.0)
        deltas = {
            "shp_delta_pct": round(((cand_last.shp or 0) - b_shp) / b_shp * 100.0, 2),
            "itt_delta_c": round((cand_last.itt_c or 0) - (base_last.itt_c or 0), 1),
        }
    elif engine.category == AeroCategory.PISTON:
        baseline_metrics = {"power_bhp": base_last.power_bhp or 0, "rpm": base_last.rpm or 0, "cht_c": base_last.cht_c or 0, "fuel_flow_gph": base_last.fuel_flow_gph or 0}
        candidate_metrics = {"power_bhp": cand_last.power_bhp or 0, "rpm": cand_last.rpm or 0, "cht_c": cand_last.cht_c or 0, "fuel_flow_gph": cand_last.fuel_flow_gph or 0}
        b_bhp = max(0.1, base_last.power_bhp or 1.0)
        deltas = {
            "power_delta_pct": round(((cand_last.power_bhp or 0) - b_bhp) / b_bhp * 100.0, 2),
            "cht_delta_c": round((cand_last.cht_c or 0) - (base_last.cht_c or 0), 1),
        }
    else:
        baseline_metrics = {"thrust_kn": base_last.thrust_kn or 0, "spool_n_pct": base_last.spool_n_pct or 0, "egt_c": base_last.turbine_egt_c or 0}
        candidate_metrics = {"thrust_kn": cand_last.thrust_kn or 0, "spool_n_pct": cand_last.spool_n_pct or 0, "egt_c": cand_last.turbine_egt_c or 0}
        b_th = max(0.1, base_last.thrust_kn or 1.0)
        deltas = {
            "thrust_delta_pct": round(((cand_last.thrust_kn or 0) - b_th) / b_th * 100.0, 2),
            "egt_delta_c": round((cand_last.turbine_egt_c or 0) - (base_last.turbine_egt_c or 0), 1),
        }

    detected_fault_ids = [h.fault_id for h in diag_rep.hypotheses]
    status_label = "COMPLETED"
    if any(h.severity == "CRITICAL" for h in diag_rep.hypotheses):
        status_label = "CRITICAL_EXCEEDANCE"
    elif diag_rep.anomalies:
        status_label = "ANOMALY_DETECTED"

    new_report = AeroTestReport(
        test_id=f"AERO-RUN-{datetime.datetime.now().strftime('%Y%m%d')}-{len(AERO_TEST_HISTORY)+1:03d}",
        engine_id=engine.engine_id,
        engine_name=f"{engine.manufacturer} {engine.model_designation}",
        category=engine.category,
        test_name=payload.test_name,
        scenario_id=payload.scenario_id,
        timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        duration_s=scenario.duration_s,
        status=status_label,
        faults_injected=payload.injected_faults or [],
        faults_detected=detected_fault_ids,
        health_score_pct=diag_rep.overall_health_score_pct,
        baseline_metrics=baseline_metrics,
        candidate_metrics=candidate_metrics,
        deltas=deltas,
        telemetry_timeline=timeline,
        model_assumptions="Standard aerodynamic equations of state, verified FAA/EASA TCDS certified boundaries.",
    )

    AERO_TEST_HISTORY.insert(0, new_report)
    return new_report


# =============================================================================
# Health Check Endpoint
# =============================================================================

@router.get("/health")
def get_aero_health():
    """Health check for Dhruva Aero Digital Twin and Physics Simulation Engine."""
    return {
        "status": "healthy",
        "module": "Dhruva Aero Aircraft Engine Digital Twin",
        "version": "1.0.0",
        "registered_aircraft_engines": aero_catalog.count(),
        "supported_categories": [c.value for c in AeroCategory],
        "physics_models": ["Piston Otto Cycle", "Turboprop Free-Turbine", "Dual-Spool High-Bypass Turbofan", "Single-Spool Axial Turbojet"],
        "diagnostic_engine": "TCDS Limits, Physics Correlation & Bayesian Evidence Attribution",
    }
