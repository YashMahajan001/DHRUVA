from ml.trend_forecasting.predict import predict_trends
from ml.utils.sample_data import make_cooling_demo_sequence


def test_trend_forecast_keys():
    trends = predict_trends(make_cooling_demo_sequence())
    assert "cht" in trends
    assert "slope" in trends["cht"]
    assert "direction" in trends["cht"]
