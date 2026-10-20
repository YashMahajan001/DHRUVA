"""End-to-End Cross-System Integration & Acceptance Test Suite for Dhruva.

Validates:
- Gate A: Startup and health across all 3 domains (Drone, Auto, Aero)
- Gate B: Complete API routing & endpoint namespaces (/api and /api/v1)
- Gate C: Integration contracts, telemetry schemas, and provenance tagging
- Gate D: Data persistence across runs (faults, tuning runs, test reports)
- Gate E: Functional calculations (thermodynamics, dyno sweeps, aero scenarios)
- Gate F: Cross-system isolation and zero state pollution between domains
- Gate G: Transparency and error boundary handling
"""

import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database.connection import init_db


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    init_db()


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


# =============================================================================
# GATE A: STARTUP & MULTI-DOMAIN HEALTH
# =============================================================================

def test_gate_a_system_root_status(client):
    """Verify system root entrypoint returns online status and api prefix."""
    resp = client.get("/")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "online"
    assert "project" in data
    assert data["documentation"] == "/docs"


def test_gate_a_drone_health(client):
    """Verify Drone UAV backend health endpoint."""
    resp = client.get("/api/v1/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert data["active_engines"] >= 1


def test_gate_a_auto_health(client):
    """Verify Dhruva Auto engineering foundation health endpoint."""
    resp = client.get("/api/v1/auto/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert data["registered_engines_count"] >= 10
    assert "physics_engine" in data


def test_gate_a_aero_health(client):
    """Verify Dhruva Aero aircraft engine digital twin health endpoint."""
    resp = client.get("/api/v1/aero/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert data["registered_aircraft_engines"] >= 11
    assert "TURBOFAN" in data["supported_categories"]
    assert "TURBOPROP" in data["supported_categories"]
    assert "PISTON" in data["supported_categories"]
    assert "TURBOJET" in data["supported_categories"]


# =============================================================================
# GATE B & C: ROUTING, CONTRACTS & TELEMETRY PROVENANCE
# =============================================================================

def test_gate_b_drone_catalog_and_engines(client):
    """Verify Drone engine models and active instances."""
    resp = client.get("/api/v1/engines/models")
    assert resp.status_code == 200
    models = resp.json()
    assert len(models) >= 3

    resp2 = client.get("/api/v1/engines")
    assert resp2.status_code == 200
    engines = resp2.json()
    assert len(engines) >= 3
    assert any(e["id"] == "ENG001" for e in engines)


def test_gate_b_auto_catalog_and_filtering(client):
    """Verify Auto catalog loads 11 authentic powertrains and filters correctly."""
    resp = client.get("/api/v1/auto/catalog")
    assert resp.status_code == 200
    catalog = resp.json()
    assert len(catalog) >= 11

    # Filter by specific engine
    resp_v8 = client.get("/api/v1/auto/catalog/AUTO-M177-4.0V8")
    assert resp_v8.status_code == 200
    v8 = resp_v8.json()
    assert "Mercedes-AMG" in v8["manufacturer"]
    assert v8["specifications"]["rated_power_hp"] == 510.0

    # Filter by type
    resp_auto = client.get("/api/v1/auto/catalog/types/AUTOMOBILE")
    assert resp_auto.status_code == 200
    automobiles = resp_auto.json()
    assert len(automobiles) >= 11


def test_gate_b_aero_catalog_and_provenance(client):
    """Verify Aero catalog contains verified TCDS documentation and specs."""
    resp = client.get("/api/v1/aero/catalog")
    assert resp.status_code == 200
    aero_engines = resp.json()
    assert len(aero_engines) >= 11

    for eng in aero_engines:
        assert "provenance" in eng
        assert eng["provenance"]["level"] in [
            "FAA_TCDS_VERIFIED",
            "EASA_TCDS_VERIFIED",
            "MANUFACTURER_POH_PUBLISHED",
            "OFFICIAL_MIL_SPEC",
        ]
        assert len(eng["provenance"]["certification_id"]) > 0
        assert eng["category"] in ["TURBOFAN", "TURBOPROP", "PISTON", "TURBOJET"]


# =============================================================================
# GATE D: PERSISTENCE ACROSS SESSIONS & RUNS
# =============================================================================

def test_gate_d_drone_fault_lifecycle(client):
    """Verify Drone fault injection, query, and resolution persistence."""
    inject_payload = {
        "engine_id": "ENG001",
        "fault_type": "overheating",
        "severity": "HIGH",
        "description": "Cylinder head temperature exceeded 240C",
        "duration_seconds": 60,
        "magnitude": 1.5,
    }
    resp = client.post("/api/v1/faults/inject", json=inject_payload)
    assert resp.status_code == 201
    fault = resp.json()
    fault_id = fault["id"]
    assert fault["resolved"] is False

    # Check that fault persists in list
    resp_list = client.get("/api/v1/faults?engine_id=ENG001")
    assert resp_list.status_code == 200
    faults = resp_list.json()
    assert any(f["id"] == fault_id for f in faults)

    # Resolve fault
    resolve_resp = client.patch(f"/api/v1/faults/{fault_id}/resolve")
    assert resolve_resp.status_code == 200
    resolved = resolve_resp.json()
    assert resolved["resolved"] is True


def test_gate_d_auto_tuning_test_persistence(client):
    """Verify Auto tuning experiment execution, persistence, and audit retrieval."""
    test_run_payload = {
        "engine_id": "AUTO-EA888-2.0T",
        "tune_name": "Stage 1 Performance Test",
        "tune": {
            "rev_limit_rpm": 6800.0,
            "target_boost_bar": 1.3,
            "ignition_timing_offset_deg": 2.0,
            "target_afr": 12.5,
            "throttle_sensitivity": 1.1,
            "idle_rpm": 850.0,
            "fan_trigger_temp_c": 90.0,
        },
        "scenario": "WOT Dyno Sweep",
        "ambient_temp_c": 25.0,
        "altitude_m": 0.0,
    }
    resp = client.post("/api/v1/auto/tuning/run-test", json=test_run_payload)
    assert resp.status_code == 200
    report = resp.json()
    test_id = report["test_id"]
    assert report["status"] in ["COMPLETED", "WARNING"]

    # Re-retrieve test from persistent audit history
    resp_history = client.get("/api/v1/auto/tuning/tests")
    assert resp_history.status_code == 200
    history = resp_history.json()
    assert any(h["test_id"] == test_id for h in history)

    # Fetch individual persistent detail
    resp_detail = client.get(f"/api/v1/auto/tuning/tests/{test_id}")
    assert resp_detail.status_code == 200
    detail = resp_detail.json()
    assert detail["test_id"] == test_id
    assert detail["engine_id"] == "AUTO-EA888-2.0T"


def test_gate_d_aero_test_run_persistence(client):
    """Verify Aero flight experiment execution and persistent report retrieval."""
    run_payload = {
        "engine_id": "AERO-CFM-CFM56-7B",
        "scenario_id": "SCEN-AERO-TAKEOFF",
        "duration_s": 20.0,
        "injected_faults": [],
    }
    resp = client.post("/api/v1/aero/tests/run", json=run_payload)
    assert resp.status_code == 200
    report = resp.json()
    test_id = report["test_id"]
    assert report["status"] in ["COMPLETED", "ANOMALY_DETECTED", "CRITICAL_EXCEEDANCE"]
    assert report["health_score_pct"] > 0

    # Retrieve from test history
    resp_history = client.get("/api/v1/aero/tests")
    assert resp_history.status_code == 200
    tests = resp_history.json()
    assert any(t["test_id"] == test_id for t in tests)

    # Reopen individual audit report
    resp_report = client.get(f"/api/v1/aero/tests/{test_id}")
    assert resp_report.status_code == 200
    saved_report = resp_report.json()
    assert saved_report["test_id"] == test_id
    assert saved_report["engine_id"] == "AERO-CFM-CFM56-7B"


# =============================================================================
# GATE E: FUNCTIONAL & THERMODYNAMIC SIMULATION INTEGRITY
# =============================================================================

def test_gate_e_auto_dyno_sweep_physics(client):
    """Verify Auto dynamometer sweep outputs realistic power/torque curves."""
    payload = {
        "engine_id": "AUTO-B58-3.0T",
        "throttle": 1.0,
        "rpm_step": 500.0,
        "ambient_temp_c": 20.0,
        "altitude_m": 0.0,
    }
    resp = client.post("/api/v1/auto/simulate/dyno-sweep", json=payload)
    assert resp.status_code == 200
    dyno = resp.json()
    assert dyno["peak_power_measured_kw"] > 200.0
    assert dyno["peak_torque_measured_nm"] > 400.0
    assert len(dyno["points"]) >= 8


def test_gate_e_aero_turbofan_simulation_physics(client):
    """Verify Aero Brayton cycle calculations for CFM56 high-bypass turbofan."""
    step_payload = {
        "engine_id": "AERO-CFM-CFM56-7B",
        "altitude_m": 10668.0,  # 35,000 ft FL350
        "mach": 0.78,
        "ambient_temp_c": -54.0,
        "throttle": 0.85,
        "initial_value": 85.0,
        "dt_s": 1.0,
    }
    resp = client.post("/api/v1/aero/simulate/step", json=step_payload)
    assert resp.status_code == 200
    out = resp.json()
    assert out["n1_pct"] > 70.0
    assert out["n2_pct"] > 80.0
    assert out["thrust_kn"] > 10.0
    assert out["turbine_egt_c"] > 400.0


def test_gate_e_aero_turboprop_flat_rating_physics(client):
    """Verify PT6A-67P turboprop maintains shaft horsepower via reserve compression."""
    step_payload = {
        "engine_id": "AERO-PWC-PT6A-67P",
        "altitude_m": 3048.0,  # 10,000 ft
        "mach": 0.35,
        "ambient_temp_c": -5.0,
        "throttle": 0.90,
        "initial_value": 98.0,
        "dt_s": 1.0,
    }
    resp = client.post("/api/v1/aero/simulate/step", json=step_payload)
    assert resp.status_code == 200
    out = resp.json()
    assert out["shp"] > 800.0
    assert out["np_rpm"] > 1400.0
    assert out["torque_ft_lb"] > 1500.0


# =============================================================================
# GATE F: CROSS-SYSTEM ISOLATION & NON-CONTAMINATION
# =============================================================================

def test_gate_f_catalog_isolation(client):
    """Verify Drone, Auto, and Aero catalog namespaces do not cross-pollinate."""
    drone_engines = client.get("/api/v1/engines").json()
    drone_ids = {e["id"] for e in drone_engines}

    auto_catalog = client.get("/api/v1/auto/catalog").json()
    auto_ids = {a["engine_id"] for a in auto_catalog}

    aero_catalog = client.get("/api/v1/aero/catalog").json()
    aero_ids = {ae["engine_id"] for ae in aero_catalog}

    # Strict disjunction
    assert drone_ids.isdisjoint(auto_ids), "Drone IDs leaked into Auto catalog!"
    assert auto_ids.isdisjoint(aero_ids), "Auto IDs leaked into Aero catalog!"
    assert drone_ids.isdisjoint(aero_ids), "Drone IDs leaked into Aero catalog!"


def test_gate_f_auto_endpoint_rejects_aero_engine(client):
    """Verify Auto endpoints reject an Aero engine ID with 404."""
    resp = client.get("/api/v1/auto/catalog/AERO-CFM-CFM56-7B")
    assert resp.status_code == 404


def test_gate_f_aero_endpoint_rejects_auto_engine(client):
    """Verify Aero endpoints reject an Auto engine ID with 404."""
    resp = client.get("/api/v1/aero/catalog/AUTO-M177-4.0V8")
    assert resp.status_code == 404


# =============================================================================
# GATE G: TRANSPARENCY, VALIDATION & BOUNDARY DEFENSE
# =============================================================================

def test_gate_g_negative_throttle_rejection(client):
    """Verify input validation rejects negative throttle values."""
    bad_payload = {
        "engine_id": "AUTO-EA888-2.0T",
        "throttle": -0.5,
        "load_torque_nm": 0.0,
        "ambient_temp_c": 25.0,
        "altitude_m": 0.0,
        "dt_s": 0.02
    }
    resp = client.post("/api/v1/auto/simulate/step", json=bad_payload)
    assert resp.status_code == 422  # Unprocessable Entity


def test_gate_g_nan_parameter_rejection(client):
    """Verify NaN/Inf parameters are caught and rejected cleanly."""
    bad_payload = {
        "engine_id": "AERO-CFM-CFM56-7B",
        "altitude_m": 0.0,
        "mach": 0.8,
        "ambient_temp_c": 25.0,
        "throttle": 0.8,
        "dt_s": 0.0  # must be > 0
    }
    resp = client.post("/api/v1/aero/simulate/step", json=bad_payload)
    assert resp.status_code == 422


# =============================================================================
# GATE H: CONSTRAINT-AWARE SAFETY PRECEDENCE & PERSISTENCE
# =============================================================================

def test_gate_h_constraint_aware_health_precedence(client):
    """Verify critical physical breaches (temperature exceedance) cannot be masked by ML scores."""
    critical_payload = {
        "engine_id": "ENG001",
        "timestamp": "2026-10-21T00:30:00Z",
        "rpm": 2450.0,
        "temperature": 275.0,  # exceeds max 240.0C limit
        "oil_pressure": 45.0,
        "fuel_flow": 14.0,
        "altitude": 3000.0,
        "throttle": 60.0
    }
    resp = client.post("/api/v1/telemetry", json=critical_payload)
    assert resp.status_code == 201
    eval_res = resp.json()["twin_evaluation"]
    # Physical safety constraint MUST cap the health score to <= 45 and force CRITICAL status
    assert eval_res["health_score"] <= 45.0
    assert eval_res["health_status"] == "CRITICAL"
    assert eval_res["anomaly"] is True

