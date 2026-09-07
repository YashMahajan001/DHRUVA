import pandas as pd

from ml.data_processing.cleaning import clean_telemetry
from ml.data_processing.feature_engineering import engineer_features


def _window():
    rows = []
    for i in range(16):
        rows.append(
            {
                "timestamp": f"2026-01-01T00:00:{i:02d}Z",
                "engine_id": "ENG001",
                "rpm": 2000 + i * 10,
                "throttle": 50,
                "cht": 180 + i,
                "egt": 700 + i * 2,
                "oil_pressure": 45,
                "oil_temperature": 90,
                "fuel_flow": 14,
                "vibration_rms": 1.2,
                "altitude": 4000,
                "ambient_temperature": 0,
                "cht_residual": 2.0 + i * 0.2,
                "egt_residual": 3.0,
            }
        )
    return engineer_features(clean_telemetry(pd.DataFrame(rows)))


def test_rate_and_rolling_features():
    featured = _window()
    assert "cht_rate_change" in featured.columns
    assert featured["cht_rate_change"].iloc[-1] != 0
    assert "cht_rolling_mean" in featured.columns
    assert featured["cht_rolling_mean"].iloc[-1] > 0


def test_residual_and_cross_sensor_features():
    featured = _window()
    assert featured["physics_prediction_residual"].iloc[-1] > 0
    assert "oil_pressure_rpm_ratio" in featured.columns
    assert "rpm_throttle_mismatch" in featured.columns
    assert "fuel_efficiency" in featured.columns
