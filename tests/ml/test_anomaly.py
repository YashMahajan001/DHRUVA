from ml.anomaly_detection.train import predict_anomaly, train_anomaly_detector
from ml.utils.sample_data import make_cooling_demo_sequence, make_training_dataset


def test_anomaly_healthy_vs_fault(tmp_path):
    data = make_training_dataset(rows_per_class=30)
    model_path = tmp_path / "anomaly.joblib"
    train_anomaly_detector(data, model_path=model_path)
    sequence = make_cooling_demo_sequence()
    healthy = predict_anomaly(sequence[:20], model_path=model_path)
    degraded = predict_anomaly(sequence, model_path=model_path)
    assert "detected" in healthy and "score" in healthy and "severity" in healthy
    assert degraded["score"] >= healthy["score"] or degraded["detected"]
