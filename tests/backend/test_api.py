import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database.connection import init_db

@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    init_db()

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "documentation" in data

def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "SIH26054 Digital Twin UAV Backend"
    assert data["active_engines"] >= 1

def test_get_engine_models(client):
    response = client.get("/api/engines/models")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 3
    model_ids = [m["id"] for m in data]
    assert "MDL-O320" in model_ids
    assert "MDL-ROTAX914" in model_ids

def test_get_engines_list(client):
    response = client.get("/api/engines")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 3
    engine_ids = [e["id"] for e in data]
    assert "ENG001" in engine_ids

def test_get_engine_detail(client):
    response = client.get("/api/engines/ENG001")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "ENG001"
    assert data["engine_model_id"] == "MDL-O320"

def test_ingest_telemetry(client):
    telemetry_payload = {
        "engine_id": "ENG001",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "rpm": 2450.0,
        "temperature": 87.5,
        "oil_pressure": 42.3,
        "fuel_flow": 18.4,
        "altitude": 3500.0,
        "throttle": 72.0
    }
    response = client.post("/api/telemetry", json=telemetry_payload)
    assert response.status_code == 201
    data = response.json()
    assert "telemetry" in data
    assert data["telemetry"]["engine_id"] == "ENG001"
    assert "twin_evaluation" in data
    assert data["twin_evaluation"]["health_score"] >= 80.0
    assert data["twin_evaluation"]["health_status"] == "GOOD"

def test_get_latest_telemetry(client):
    distinct_payload = {
        "engine_id": "ENG001",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "rpm": 2580.0,
        "temperature": 88.0,
        "oil_pressure": 45.0,
        "fuel_flow": 19.0,
        "altitude": 3600.0,
        "throttle": 75.0
    }
    client.post("/api/telemetry", json=distinct_payload)
    response = client.get("/api/telemetry/latest/ENG001")
    assert response.status_code == 200
    data = response.json()
    assert data["engine_id"] == "ENG001"
    assert data["rpm"] == 2580.0


def test_get_engine_health(client):
    response = client.get("/api/engines/ENG001/health")
    assert response.status_code == 200
    data = response.json()
    assert data["engine_id"] == "ENG001"
    assert "health_score" in data
    assert "health_status" in data
    assert "rul_hours" in data

def test_fault_injection_and_resolution(client):
    fault_payload = {
        "engine_id": "ENG001",
        "fault_type": "overheating",
        "severity": "HIGH",
        "description": "Controlled thermal spike test",
        "magnitude": 1.5
    }
    # 1. Inject fault
    inject_resp = client.post("/api/faults/inject", json=fault_payload)
    assert inject_resp.status_code == 201
    fault = inject_resp.json()
    fault_id = fault["id"]
    assert fault["fault_type"] == "overheating"
    assert fault["resolved"] is False

    # 2. Query faults
    list_resp = client.get(f"/api/faults?engine_id=ENG001&resolved=false")
    assert list_resp.status_code == 200
    active_faults = list_resp.json()
    assert any(f["id"] == fault_id for f in active_faults)

    # 3. Resolve fault
    resolve_resp = client.patch(f"/api/faults/{fault_id}/resolve")
    assert resolve_resp.status_code == 200
    assert resolve_resp.json()["resolved"] is True

def test_missions_list_and_simulation(client):
    # 1. List missions
    resp = client.get("/api/missions")
    assert resp.status_code == 200
    missions = resp.json()
    assert len(missions) >= 1

    # 2. Simulate mission
    sim_payload = {
        "mission_type": "high_altitude_isr",
        "duration_minutes": 20,
        "time_step_seconds": 1.0
    }
    sim_resp = client.post(f"/api/missions/{missions[0]['id']}/simulate", json=sim_payload)
    assert sim_resp.status_code == 200
    sim_data = sim_resp.json()
    assert sim_data["simulated_points"] > 0
    assert sim_data["status"] == "COMPLETED"

def test_tuning_profile(client):
    tune_payload = {
        "name": "High-Altitude Lean Cruise Tune",
        "engine_id": "ENG001",
        "parameters": {
            "fuel_air_ratio_bias": -0.05,
            "idle_rpm_target": 950,
            "max_throttle_limit": 98.0
        }
    }
    create_resp = client.post("/api/tuning", json=tune_payload)
    assert create_resp.status_code == 201
    profile = create_resp.json()
    profile_id = profile["id"]

    get_resp = client.get(f"/api/tuning/{profile_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["name"] == tune_payload["name"]

def test_reports_generation(client):
    resp = client.get("/api/reports/ENG001")
    assert resp.status_code == 200
    report = resp.json()
    assert report["engine_id"] == "ENG001"
    assert "health_score" in report
    assert "recommendations" in report
    assert isinstance(report["recommendations"], list)
