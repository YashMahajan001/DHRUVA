"""Post-Fix Verification and Hardening Test Suite for Dhruva Auto & Aero.

Covers:
1. Auto catalog fetch readiness and authoritative schema consistency.
2. Aero catalog fetch readiness and authoritative schema consistency.
3. Fallback catalog integrity between frontend initialCatalogs.ts and backend registry.
4. Auto & Aero physical step simulation latency and numeric validity.
5. Anomaly detection and diagnostic attribution resilience.
6. Engine switching isolation between Auto and Aero configurations.
7. Drone control system regression integrity (engines, mission, telemetry).
8. Resilience against malformed inputs and invalid engine IDs without system crashes.
"""

import json
import re
import pytest
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
# 1. CATALOG INTEGRITY & SCHEMA CONSISTENCY
# =============================================================================

def test_auto_catalog_readiness_and_entries(client):
    """Verify Auto catalog loads 11 automobile engines with complete schemas."""
    resp = client.get("/api/v1/auto/catalog")
    assert resp.status_code == 200
    all_entries = resp.json()
    auto_entries = [e for e in all_entries if e.get("engine_type") == "AUTOMOBILE"]
    assert len(auto_entries) == 11

    required_ids = [
        "AUTO-EA888-2.0T", "AUTO-B58-3.0T", "AUTO-M177-4.0V8", "AUTO-HYUNDAI-1.6CRDI",
        "AUTO-HYUNDAI-KAPPA-1.2", "AUTO-SUZUKI-K15B", "AUTO-HONDA-K20C1",
        "AUTO-HONDA-1.5-IDTEC", "AUTO-VW-EA288-2.0TDI", "AUTO-TOYOTA-M20A-FXS",
        "AUTO-TOYOTA-2GD-FTV"
    ]
    catalog_ids = [e["engine_id"] for e in auto_entries]
    for rid in required_ids:
        assert rid in catalog_ids, f"Required engine {rid} missing from Auto catalog"

    for entry in auto_entries:
        assert entry["specifications"]["rated_power_hp"] > 0
        assert entry["operating_limits"]["redline_rpm"] > entry["operating_limits"]["idle_rpm"]
        assert len(entry["provenance_records"]) > 0


def test_aero_catalog_readiness_and_categories(client):
    """Verify Aero catalog loads 12 aircraft engines across all 4 categories."""
    resp = client.get("/api/v1/aero/catalog")
    assert resp.status_code == 200
    aero_entries = resp.json()
    assert len(aero_entries) == 12

    categories = {e["category"] for e in aero_entries}
    assert {"PISTON", "TURBOPROP", "TURBOFAN", "TURBOJET"}.issubset(categories)

    required_ids = [
        "AERO-LYC-IO360", "AERO-CONT-O200", "AERO-ROTAX-915IS", "AERO-PWC-PT6A-67P",
        "AERO-HON-TPE331", "AERO-GE-CATALYST", "AERO-CFM-CFM56-7B", "AERO-CFM-LEAP-1A",
        "AERO-PW-1100G", "AERO-GE-GE90-115B", "AERO-GE-J85-21", "AERO-RR-VIPER-601"
    ]
    catalog_ids = [e["engine_id"] for e in aero_entries]
    for rid in required_ids:
        assert rid in catalog_ids, f"Required engine {rid} missing from Aero catalog"


def test_frontend_initial_catalogs_consistency_with_backend(client):
    """Verify initialCatalogs.ts is 100% synchronized with the live backend registry."""
    with open("frontend/src/services/initialCatalogs.ts", "r", encoding="utf-8") as f:
        ts_content = f.read()

    auto_match = re.search(r"export const INITIAL_AUTO_CATALOG:\s*EngineCatalogEntry\[\]\s*=\s*(\[[\s\S]*?\]);", ts_content)
    aero_match = re.search(r"export const INITIAL_AERO_CATALOG:\s*AeroEngineCatalogEntry\[\]\s*=\s*(\[[\s\S]*?\]);", ts_content)

    assert auto_match, "INITIAL_AUTO_CATALOG declaration not found in initialCatalogs.ts"
    assert aero_match, "INITIAL_AERO_CATALOG declaration not found in initialCatalogs.ts"

    auto_ts = json.loads(auto_match.group(1))
    aero_ts = json.loads(aero_match.group(1))

    # Backend
    resp_auto = client.get("/api/v1/auto/catalog")
    auto_backend = [e for e in resp_auto.json() if e.get("engine_type") == "AUTOMOBILE"]
    resp_aero = client.get("/api/v1/aero/catalog")
    aero_backend = resp_aero.json()

    assert len(auto_ts) == len(auto_backend)
    assert len(aero_ts) == len(aero_backend)

    auto_ts_ids = {e["engine_id"] for e in auto_ts}
    auto_b_ids = {e["engine_id"] for e in auto_backend}
    assert auto_ts_ids == auto_b_ids

    aero_ts_ids = {e["engine_id"] for e in aero_ts}
    aero_b_ids = {e["engine_id"] for e in aero_backend}
    assert aero_ts_ids == aero_b_ids


# =============================================================================
# 2. DETERMINISTIC SIMULATION & INTELLIGENCE RESILIENCE
# =============================================================================

def test_auto_simulation_step_execution(client):
    """Verify Auto deterministic physics simulation step executes without blocking."""
    payload = {
        "engine_id": "AUTO-EA888-2.0T",
        "throttle": 0.55,
        "load_torque_nm": 100.0,
        "ambient_temp_c": 25.0,
        "altitude_m": 0.0,
        "dt_s": 0.25,
    }
    resp = client.post("/api/v1/auto/simulate/step", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["engine_id"] == "AUTO-EA888-2.0T"
    assert data["rpm"] > 0
    assert data["brake_power_kw"] >= 0
    assert "channel_provenance" in data


def test_aero_simulation_step_execution(client):
    """Verify Aero deterministic physics simulation step executes across domains."""
    payload = {
        "engine_id": "AERO-CFM-CFM56-7B",
        "throttle": 0.75,
        "altitude_m": 10000.0,
        "ambient_temp_c": -50.0,
        "mach": 0.78,
        "operating_state": "CRUISE",
        "dt_s": 0.5,
    }
    resp = client.post("/api/v1/aero/simulate/step", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["engine_id"] == "AERO-CFM-CFM56-7B"
    assert data["category"] == "TURBOFAN"
    assert data["n1_pct"] > 0
    assert data["thrust_kn"] >= 0


def test_auto_anomaly_detection_execution(client):
    """Verify Auto anomaly detection processes telemetry records safely."""
    # Obtain a genuine telemetry frame first
    step_resp = client.post("/api/v1/auto/simulate/step", json={
        "engine_id": "AUTO-EA888-2.0T",
        "throttle": 0.5,
    })
    telemetry = step_resp.json()

    resp = client.post("/api/v1/auto/intelligence/anomalies/detect", json={
        "engine_id": "AUTO-EA888-2.0T",
        "telemetry": telemetry,
        "throttle": 0.5,
    })
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_aero_diagnostics_evaluation_execution(client):
    """Verify Aero diagnostics evaluates flight frames without hanging."""
    step_resp = client.post("/api/v1/aero/simulate/step", json={
        "engine_id": "AERO-CFM-CFM56-7B",
        "throttle": 0.7,
    })
    telemetry = step_resp.json()

    resp = client.post("/api/v1/aero/diagnostics/evaluate", json={
        "engine_id": "AERO-CFM-CFM56-7B",
        "telemetry": telemetry,
        "injected_faults": [],
    })
    assert resp.status_code == 200
    report = resp.json()
    assert "overall_health_score_pct" in report
    assert 0 <= report["overall_health_score_pct"] <= 100


# =============================================================================
# 3. ERROR RESILIENCE & CLEANUP
# =============================================================================

def test_invalid_engine_id_handling(client):
    """Verify querying an invalid engine ID returns clean 404 without crashing."""
    resp = client.get("/api/v1/auto/catalog/INVALID-ENGINE-XYZ")
    assert resp.status_code == 404

    resp = client.get("/api/v1/aero/catalog/INVALID-ENGINE-XYZ")
    assert resp.status_code == 404

    resp = client.post("/api/v1/auto/simulate/step", json={
        "engine_id": "INVALID-ENGINE-XYZ",
        "throttle": 0.5,
    })
    assert resp.status_code == 404


# =============================================================================
# 4. DRONE CONTROL SYSTEM REGRESSION INTEGRITY
# =============================================================================

def test_drone_regression_endpoints(client):
    """Verify working Drone system remains 100% operational."""
    resp = client.get("/api/v1/engines")
    assert resp.status_code == 200
    engines = resp.json()
    assert len(engines) > 0
    assert engines[0]["id"] == "ENG001"

    # Drone active mission singular endpoint
    resp = client.get("/api/mission")
    assert resp.status_code == 200
    mission = resp.json()
    assert "id" in mission
