from ml.fault_classification.train import predict_fault, train_fault_classifier
from ml.utils.sample_data import make_cooling_demo_sequence, make_training_dataset


def test_fault_prediction_and_known_classes(tmp_path):
    data = make_training_dataset(rows_per_class=40)
    model_path = tmp_path / "fault.joblib"
    train_fault_classifier(data, model_path=model_path)
    result = predict_fault(make_cooling_demo_sequence(), model_path=model_path)
    assert "type" in result and "confidence" in result
    assert 0 <= result["confidence"] <= 1
    assert isinstance(result["type"], str)
    assert result["type"] in {
        "healthy",
        "cooling_degradation",
        "overheating",
        "injector_degradation",
        "misfire",
        "lubrication_loss",
        "abnormal_vibration",
        "alternator_degradation",
        "sensor_bias",
        "sensor_drift",
        "sensor_dropout",
    }
