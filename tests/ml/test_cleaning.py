import pandas as pd

from ml.data_processing.cleaning import clean_telemetry, telemetry_to_frame


def test_valid_telemetry_is_marked_valid():
    df = pd.DataFrame(
        [
            {
                "timestamp": "2026-01-01T00:00:00Z",
                "engine_id": "ENG001",
                "rpm": 2400,
                "cht": 190,
                "egt": 740,
                "oil_pressure": 50,
                "throttle": 60,
            }
        ]
    )
    cleaned = clean_telemetry(df)
    assert cleaned["data_valid"].iloc[0]
    assert cleaned["engine_id"].iloc[0] == "ENG001"


def test_aliases_are_normalized():
    df = pd.DataFrame([{"CHT": 200, "oil_temp": 90, "ambient_temp": 10, "RUL": 40}])
    cleaned = clean_telemetry(df)
    assert "cht" in cleaned.columns
    assert cleaned["cht"].iloc[0] == 200
    assert cleaned["oil_temperature"].iloc[0] == 90
    assert cleaned["ambient_temperature"].iloc[0] == 10


def test_missing_and_invalid_values():
    df = pd.DataFrame(
        [
            {"timestamp": "2026-01-01T00:00:00Z", "engine_id": "E1", "cht": 180, "rpm": 2000},
            {"timestamp": "2026-01-01T00:00:01Z", "engine_id": "E1", "cht": None, "rpm": 2010},
            {"timestamp": "not-a-date", "engine_id": "E1", "cht": 9000, "rpm": 2020},
        ]
    )
    cleaned = clean_telemetry(df)
    assert cleaned["cht"].notna().all()
    assert cleaned["timestamp_invalid"].iloc[-1]
    assert bool(cleaned["cht_out_of_range"].iloc[-1])


def test_duplicate_rows_dropped():
    df = pd.DataFrame(
        [
            {"timestamp": "2026-01-01T00:00:00Z", "engine_id": "E1", "rpm": 1},
            {"timestamp": "2026-01-01T00:00:00Z", "engine_id": "E1", "rpm": 2},
        ]
    )
    cleaned = clean_telemetry(df)
    assert len(cleaned) == 1
    assert cleaned["rpm"].iloc[0] == 2


def test_telemetry_to_frame_accepts_dict():
    frame = telemetry_to_frame({"rpm": 1000})
    assert len(frame) == 1
