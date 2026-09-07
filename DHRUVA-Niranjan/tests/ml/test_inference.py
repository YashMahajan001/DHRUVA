import json

from ml.inference.inference_service import run_inference
from ml.health_status import health_from_index
from ml.utils.sample_data import make_cooling_demo_sequence


def test_run_inference_contract():
    result = run_inference(make_cooling_demo_sequence()[:20])
    json.dumps(result)
    for key in (
        "engine_id",
        "timestamp",
        "health_index",
        "status",
        "anomaly",
        "fault",
        "rul",
        "sensor_drift",
        "digital_twin_state",
        "explanation",
    ):
        assert key in result
    assert result["status"] in {"NORMAL", "WATCH", "WARNING", "CRITICAL"}
    assert "detected" in result["anomaly"]
    assert "type" in result["fault"]
    assert "hours" in result["rul"]


def test_cooling_demo_worsens_health():
    sequence = make_cooling_demo_sequence()
    healthy = run_inference(sequence[:25])
    degraded = run_inference(sequence)
    assert degraded["health_index"] <= healthy["health_index"] + 1e-6
    assert degraded["rul"]["hours"] <= healthy["rul"]["hours"] + 1e-6


def test_consumes_twin_residuals_and_health():
    row = make_cooling_demo_sequence()[-1]
    row["digital_twin_state"] = {
        "health_index": 67.0,
        "status": "WARNING",
        "model_version": "twin-phase2-demo",
    }
    row["health_index"] = 67.0
    result = run_inference(row)
    assert result["health_index"] == 67.0
    assert result["status"] == "WARNING"
    assert result["digital_twin_state"].get("health_index") == 67.0


def test_health_bands_are_prototype_mapping():
    assert health_from_index(95) == "NORMAL"
    assert health_from_index(80) == "WATCH"
    assert health_from_index(55) == "WARNING"
    assert health_from_index(20) == "CRITICAL"
