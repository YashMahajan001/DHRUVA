from datetime import datetime, timezone

from data.schemas.telemetry_schema import TELEMETRY_COLUMNS, TelemetryRecord
from simulation.engine_simulator import generate_telemetry


def test_telemetry_schema_columns():
    df = generate_telemetry(duration=5, sampling_rate=1, seed=1)
    assert list(df.columns) == TELEMETRY_COLUMNS
    TelemetryRecord.model_validate(df.iloc[0].to_dict())
    assert (df["health_index"].between(0, 100)).all()
    assert (df["rul"] >= 0).all()
    for col in (
        "cht_residual",
        "egt_residual",
        "oil_pressure_residual",
        "fuel_flow_residual",
        "rpm_residual",
        "vibration_rms_residual",
    ):
        assert col in df.columns


def test_timestamps_ordered_and_valid():
    df = generate_telemetry(duration=8, sampling_rate=1, seed=1)
    ts = pd_to_utc(df)
    assert all(later > earlier for earlier, later in zip(ts, ts[1:]))


def pd_to_utc(df):
    out = []
    for t in df["timestamp"]:
        if isinstance(t, str):
            out.append(datetime.fromisoformat(str(t)).replace(tzinfo=timezone.utc))
        else:
            out.append(t)
    return out
