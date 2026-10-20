"""Unit tests for Dhruva Aero REST API endpoints."""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_api_aero_catalog():
    """Verify GET /api/aero/catalog returns all verified engines."""
    resp = client.get("/api/aero/catalog")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) >= 10
    categories = {item["category"] for item in data}
    assert "PISTON" in categories
    assert "TURBOFAN" in categories


def test_api_aero_catalog_by_id():
    """Verify GET /api/aero/catalog/{id} returns full specifications and limits."""
    resp = client.get("/api/aero/catalog/AERO-CFM-CFM56-7B")
    assert resp.status_code == 200
    data = resp.json()
    assert data["model_designation"] == "CFM56-7B27"
    assert data["specifications"]["rated_takeoff_thrust_kn"] == 121.4
    assert data["operating_limits"]["max_turbine_egt_c"] == 950.0


def test_api_aero_step_simulation():
    """Verify POST /api/aero/simulate/step returns valid telemetry with provenance."""
    payload = {
        "engine_id": "AERO-CFM-CFM56-7B",
        "throttle": 0.85,
        "ambient_temp_c": -15.0,
        "altitude_m": 5000.0,
        "mach": 0.65,
        "operating_state": "CLIMB",
        "dt_s": 0.05,
    }
    resp = client.post("/api/aero/simulate/step", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["engine_id"] == "AERO-CFM-CFM56-7B"
    assert data["data_source"] == "SIMULATED"
    assert data["n1_pct"] is not None
    assert data["thrust_kn"] is not None
    assert "n1_pct" in data["signals"]
    assert data["signals"]["n1_pct"]["unit"] == "%"


def test_api_aero_diagnostics_evaluate():
    """Verify POST /api/aero/diagnostics/evaluate accurately assesses engine health."""
    # First get a valid telemetry frame
    step_resp = client.post("/api/aero/simulate/step", json={
        "engine_id": "AERO-CFM-CFM56-7B",
        "throttle": 0.78,
    })
    telemetry = step_resp.json()

    diag_resp = client.post("/api/aero/diagnostics/evaluate", json={
        "engine_id": "AERO-CFM-CFM56-7B",
        "telemetry": telemetry,
        "injected_faults": ["FAULT-TURBINE-CREEP"],
    })
    assert diag_resp.status_code == 200
    report = diag_resp.json()
    assert "overall_health_score_pct" in report
    assert any(h["fault_id"] == "FAULT-TURBINE-CREEP" for h in report["hypotheses"])


def test_api_aero_test_history():
    """Verify GET /api/aero/tests and POST /api/aero/tests/run."""
    resp = client.get("/api/aero/tests")
    assert resp.status_code == 200
    tests = resp.json()
    assert len(tests) >= 3

    # Execute a new test run
    run_resp = client.post("/api/aero/tests/run", json={
        "engine_id": "AERO-CFM-CFM56-7B",
        "test_name": "API Automated Verification Run",
        "scenario_id": "SCEN-AERO-TAKEOFF",
        "injected_faults": [],
        "ambient_temp_c": 15.0,
        "altitude_m": 0.0,
    })
    assert run_resp.status_code == 200
    new_test = run_resp.json()
    assert new_test["engine_id"] == "AERO-CFM-CFM56-7B"
    assert "deltas" in new_test
    assert len(new_test["telemetry_timeline"]) > 0


def test_api_aero_health():
    """Verify GET /api/aero/health endpoint."""
    resp = client.get("/api/aero/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert data["registered_aircraft_engines"] >= 10
