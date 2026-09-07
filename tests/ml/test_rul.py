from ml.rul.train import estimate_rul_from_health, predict_rul, train_rul_model
from ml.utils.sample_data import make_cooling_demo_sequence, make_training_dataset


def test_rul_degrades_with_health():
    healthy = estimate_rul_from_health(94.0, 0.1)
    degraded = estimate_rul_from_health(67.0, 0.8)
    assert healthy["hours"] > degraded["hours"]
    assert degraded["uncertainty_hours"] >= 3.0


def test_rul_model_train_predict(tmp_path):
    data = make_training_dataset(rows_per_class=20)
    model_path = tmp_path / "rul.joblib"
    train_rul_model(data, model_path=model_path)
    result = predict_rul(make_cooling_demo_sequence(), model_path=model_path, health_index=67.0)
    assert result["hours"] >= 0
    assert "uncertainty_hours" in result
