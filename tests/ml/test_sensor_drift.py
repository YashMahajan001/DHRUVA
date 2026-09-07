from ml.sensor_drift.detector import detect_sensor_drift
from ml.utils.sample_data import make_training_dataset


def test_normal_sensor_not_flagged():
    healthy = make_training_dataset(rows_per_class=20)
    healthy = healthy[healthy["fault_label"] == "healthy"]
    result = detect_sensor_drift(healthy)
    assert result["detected"] is False
    assert result["sensor"] is None


def test_injected_drift_or_bias_detected():
    data = make_training_dataset(rows_per_class=30)
    drifted = data[data["fault_label"].isin(["sensor_drift", "sensor_bias"])]
    result = detect_sensor_drift(drifted)
    assert result["detected"] is True
    assert result["sensor"] is not None
    assert result["severity"] in {"low", "medium", "high"}


def test_dropout_detected():
    data = make_training_dataset(rows_per_class=20)
    dropped = data[data["fault_label"] == "sensor_dropout"]
    result = detect_sensor_drift(dropped)
    assert result["detected"] is True
    assert result.get("mode") == "dropout" or result["severity"] in {"medium", "high"}
