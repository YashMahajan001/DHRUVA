from data.faults.fault_types import KNOWN_FAULTS
from simulation.engine_simulator import generate_telemetry


def test_fault_injection_labels():
    df = generate_telemetry(
        duration=40,
        seed=5,
        faults=[{"type": "OVERHEATING", "start": 20, "duration": 20, "severity": 0.8, "progression": "sudden"}],
    )
    assert (df.loc[df.index < 20, "fault_label"] == "HEALTHY").all()
    assert (df.loc[df.index >= 20, "fault_label"] == "OVERHEATING").all()
    assert df.loc[df.index >= 20, "fault_active"].all()


def test_gradual_fault_progression():
    kwargs = dict(duration=50, seed=5, mission_profile="CUSTOM")
    healthy = generate_telemetry(**kwargs)
    df = generate_telemetry(
        **kwargs,
        faults=[{"type": "COOLING_DEGRADATION", "start": 10, "duration": 30, "severity": 0.9, "progression": "gradual"}],
    )
    delta_early = df.loc[12, "cht"] - healthy.loc[12, "cht"]
    delta_late = df.loc[38, "cht"] - healthy.loc[38, "cht"]
    assert delta_late > delta_early > 0


def test_sudden_fault():
    df = generate_telemetry(
        duration=30,
        seed=5,
        faults=[{"type": "LUBRICATION_PRESSURE_LOSS", "start": 15, "duration": 15, "severity": 0.8, "progression": "sudden"}],
    )
    before = df.loc[df.index == 14, "oil_pressure"].iloc[0]
    after = df.loc[df.index == 15, "oil_pressure"].iloc[0]
    assert after < before * 0.85


def test_sensor_drift():
    kwargs = dict(duration=40, seed=8, mission_profile="CUSTOM")
    healthy = generate_telemetry(**kwargs)
    df = generate_telemetry(
        **kwargs,
        faults=[
            {
                "type": "SENSOR_DRIFT",
                "start": 5,
                "duration": 30,
                "severity": 0.8,
                "progression": "gradual",
                "affected_sensor": "cht",
            }
        ],
    )
    delta_early = df.loc[8, "cht"] - healthy.loc[8, "cht"]
    delta_late = df.loc[32, "cht"] - healthy.loc[32, "cht"]
    assert delta_late > delta_early > 0
    assert df.loc[df.index > 5, "fault_label"].eq("SENSOR_DRIFT").all()


def test_sensor_dropout():
    df = generate_telemetry(
        duration=25,
        seed=8,
        faults=[
            {
                "type": "SENSOR_DROPOUT",
                "start": 10,
                "duration": 5,
                "severity": 1.0,
                "progression": "sudden",
                "affected_sensor": "oil_pressure",
            }
        ],
    )
    window = df.loc[(df.index >= 10) & (df.index <= 15), "oil_pressure"]
    assert window.isna().all()
    assert (df.loc[(df.index >= 10) & (df.index <= 15), "data_quality"] == 0.0).all()
    assert df.loc[df.index == 5, "oil_pressure"].notna().iloc[0]
    assert df.loc[df.index == 20, "oil_pressure"].notna().iloc[0]
    assert df.loc[df.index == 20, "fault_label"].iloc[0] == "HEALTHY"


def test_multi_fault_optional():
    df = generate_telemetry(
        duration=20,
        seed=2,
        faults=[
            {"type": "COOLING_DEGRADATION", "start": 5, "duration": 15, "severity": 0.4, "progression": "gradual"},
            {"type": "SENSOR_DRIFT", "start": 8, "duration": 10, "severity": 0.3, "progression": "gradual", "affected_sensor": "egt"},
        ],
    )
    labels = set(df.loc[df["fault_active"], "fault_label"])
    assert any("+" in item or item == "COOLING_DEGRADATION" for item in labels)


def test_all_known_fault_types_inject():
    for name in KNOWN_FAULTS:
        extra = {}
        if name.startswith("SENSOR_"):
            extra["affected_sensor"] = "cht"
        df = generate_telemetry(
            duration=12,
            seed=1,
            mission_profile="CUSTOM",
            faults=[{"type": name, "start": 6, "duration": 4, "severity": 0.5, "progression": "sudden", **extra}],
        )
        assert (df.loc[df.index >= 6, "fault_label"] == name).any()
