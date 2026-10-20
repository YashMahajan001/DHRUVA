"""Automated integration tests for Dhruva Auto Phase 2 FastAPI endpoints."""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_api_health_reports_phase2():
    response = client.get("/api/auto/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["phase"] == "PHASE 2"
    assert "intelligence" in data
    assert "anomaly_detection" in data["intelligence"]


def test_api_detect_anomalies_endpoint():
    # Fetch a step simulation first to get a realistic telemetry record
    step_resp = client.post(
        "/api/auto/simulate/step",
        json={
            "engine_id": "AUTO-EA888-2.0T",
            "throttle": 0.85,
            "load_torque_nm": 200.0,
            "dt_s": 0.05,
            "initial_rpm": 3500.0,
        },
    )
    assert step_resp.status_code == 200
    telem = step_resp.json()

    # Inject an anomaly (very low oil pressure while at high RPM)
    telem["oil_pressure_bar"] = 0.8

    detect_resp = client.post(
        "/api/auto/intelligence/anomalies/detect",
        json={
            "engine_id": "AUTO-EA888-2.0T",
            "telemetry": telem,
            "throttle": 0.85,
        },
    )
    assert detect_resp.status_code == 200
    anomalies = detect_resp.json()
    assert len(anomalies) >= 1
    assert any(a["channel"] == "oil_pressure_bar" for a in anomalies)


def test_api_diagnostics_hypothesize_endpoint():
    payload = {
        "engine_id": "AUTO-EA888-2.0T",
        "anomalies": [
            {
                "channel": "manifold_pressure_kpa",
                "detection_method": "PHYSICAL_ENVELOPE",
                "severity": "WARNING",
                "measured_or_simulated_value": 105.0,
                "expected_range": [160.0, 240.0],
                "deviation": 55.0,
                "unit": "kPa",
                "explanation": "Boost deficit detected at high throttle",
                "timestamp_s": 5.0,
            }
        ],
    }
    resp = client.post("/api/auto/intelligence/diagnostics/hypothesize", json=payload)
    assert resp.status_code == 200
    hypotheses = resp.json()
    assert len(hypotheses) >= 1
    assert hypotheses[0]["is_hypothesis"] is True
    assert hypotheses[0]["fault_id"] == "FAULT-BOOST-LEAK"


def test_api_degradation_estimate_endpoint():
    payload = {
        "engine_id": "AUTO-EA888-2.0T",
        "cumulative_hours": 150.0,
        "mean_rpm": 3000.0,
        "mean_oil_temp_c": 95.0,
        "mean_coolant_temp_c": 90.0,
        "mean_throttle": 0.5,
        "high_temp_excursion_hours": 2.0,
    }
    resp = client.post("/api/auto/intelligence/degradation/estimate", json=payload)
    assert resp.status_code == 200
    degradations = resp.json()
    assert len(degradations) == 4
    for item in degradations:
        assert item["status"] == "SUFFICIENT_DATA"
        assert item["rul_hours_estimate"] is not None


def test_api_missions_scenarios_and_monte_carlo():
    # 1. Fetch scenarios
    scen_resp = client.get("/api/auto/missions/scenarios")
    assert scen_resp.status_code == 200
    scenarios = scen_resp.json()
    assert len(scenarios) >= 4

    # 2. Run Monte Carlo simulation
    mc_payload = {
        "engine_id": "AUTO-EA888-2.0T",
        "scenario_id": "SCEN-TRACK-DAY",
        "iterations": 200,
        "random_seed": 42,
    }
    mc_resp = client.post("/api/auto/missions/simulate-reliability", json=mc_payload)
    assert mc_resp.status_code == 200
    result = mc_resp.json()
    assert result["provenance_label"] == "SIMULATED_RELIABILITY_ESTIMATE"
    assert result["total_iterations"] == 200
    assert 0.0 <= result["mission_success_rate"] <= 1.0
    assert len(result["survival_curve"]) > 0


def test_api_subsystems_graph_endpoint():
    resp = client.get("/api/auto/subsystems/graph")
    assert resp.status_code == 200
    data = resp.json()
    assert "dependencies" in data
    assert "fault_modes" in data
    assert "FAULT-BOOST-LEAK" in data["fault_modes"]
