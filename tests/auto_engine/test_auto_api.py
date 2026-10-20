"""Tests for the Dhruva Auto Engineering Foundation REST API endpoints."""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database.connection import init_db


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    init_db()


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def test_api_auto_health(client):
    """GET /api/auto/health returns 200 with module health status."""
    res = client.get("/api/auto/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["phase"] in ("PHASE 1", "PHASE 2")
    assert data["registered_engines_count"] >= 6


def test_api_get_catalog(client):
    """GET /api/auto/catalog returns list of all registered engines with provenance."""
    res = client.get("/api/auto/catalog")
    assert res.status_code == 200
    engines = res.json()
    assert len(engines) >= 6
    ids = [e["engine_id"] for e in engines]
    assert "AUTO-EA888-2.0T" in ids
    assert "DRONE-ROTAX-914" in ids
    assert "AERO-PT6A-67A" in ids


def test_api_get_catalog_detail(client):
    """GET /api/auto/catalog/{engine_id} returns detailed specs and limits."""
    res = client.get("/api/auto/catalog/AUTO-EA888-2.0T")
    assert res.status_code == 200
    data = res.json()
    assert data["engine_id"] == "AUTO-EA888-2.0T"
    assert data["engine_type"] == "AUTOMOBILE"
    assert data["specifications"]["rated_power_kw"] == 162.0
    assert len(data["provenance_records"]) > 0


def test_api_get_catalog_not_found(client):
    """GET /api/auto/catalog/{invalid} returns 404."""
    res = client.get("/api/auto/catalog/UNKNOWN-INVALID-ENGINE")
    assert res.status_code == 404


def test_api_filter_catalog_by_type(client):
    """GET /api/auto/catalog/types/{engine_type} filters by domain."""
    res = client.get("/api/auto/catalog/types/AUTOMOBILE")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 3
    assert all(e["engine_type"] == "AUTOMOBILE" for e in data)


def test_api_telemetry_channels(client):
    """GET /api/auto/telemetry/channels returns channel metadata dictionary."""
    res = client.get("/api/auto/telemetry/channels")
    assert res.status_code == 200
    data = res.json()
    assert "rpm" in data
    assert "brake_power_kw" in data
    assert data["rpm"]["unit"] == "RPM"
    assert data["rpm"]["provenance"] == "SIMULATED"


def test_api_simulate_step(client):
    """POST /api/auto/simulate/step executes single physics step."""
    payload = {
        "engine_id": "AUTO-EA888-2.0T",
        "throttle": 0.8,
        "load_torque_nm": 120.0,
        "ambient_temp_c": 20.0,
        "altitude_m": 100.0,
        "dt_s": 0.05,
    }
    res = client.post("/api/auto/simulate/step", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["engine_id"] == "AUTO-EA888-2.0T"
    assert data["is_synthetic"] is True
    assert data["rpm"] > 0.0
    assert data["brake_torque_nm"] > 0.0
    assert data["brake_power_kw"] > 0.0
    assert "channel_provenance" in data


def test_api_simulate_step_invalid_throttle(client):
    """POST /api/auto/simulate/step rejects invalid throttle > 1.0 with 422."""
    payload = {
        "engine_id": "AUTO-EA888-2.0T",
        "throttle": 1.5,  # Invalid
        "load_torque_nm": 10.0,
    }
    res = client.post("/api/auto/simulate/step", json=payload)
    assert res.status_code == 422


def test_api_dyno_sweep(client):
    """POST /api/auto/simulate/dyno-sweep executes dynamometer sweep test."""
    payload = {
        "engine_id": "AUTO-EA888-2.0T",
        "throttle": 1.0,
        "rpm_step": 500.0,
    }
    res = client.post("/api/auto/simulate/dyno-sweep", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["engine_id"] == "AUTO-EA888-2.0T"
    assert len(data["points"]) >= 10
    assert data["peak_power_measured_kw"] > 100.0
    assert data["peak_torque_measured_nm"] > 250.0
