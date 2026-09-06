import math

import pandas as pd
import pytest

from simulation.engine_simulator import generate_telemetry
from simulation.exceptions import ConfigError


def test_healthy_telemetry_generation():
    df = generate_telemetry(
        engine_model="O320_CLASS",
        mission_profile="HIGH_ALTITUDE_ISR",
        duration=30,
        sampling_rate=1,
        seed=42,
    )
    assert len(df) == 30
    assert (df["fault_label"] == "HEALTHY").all()
    assert not df["fault_active"].any()
    assert (df["rpm"] > 0).all()
    assert df["throttle"].between(0.0, 1.0).all()


def test_reproducibility_with_seed():
    kwargs = dict(engine_model="O320_CLASS", mission_profile="CUSTOM", duration=20, sampling_rate=1, seed=42)
    a = generate_telemetry(**kwargs)
    b = generate_telemetry(**kwargs)
    pd.testing.assert_frame_equal(a, b)


def test_correlated_not_independent():
    df = generate_telemetry(duration=40, sampling_rate=1, seed=7, mission_profile="RAPID_RESPONSE")
    corr = df["throttle"].corr(df["fuel_flow"])
    assert corr > 0.4


def test_environment_affects_telemetry():
    hot = generate_telemetry(mission_profile="HOT_WEATHER", duration=25, seed=3)
    cold = generate_telemetry(mission_profile="HIGH_ALTITUDE_ISR", duration=25, seed=3)
    assert hot["ambient_temp"].mean() > cold["ambient_temp"].mean()


def test_engines_differ():
    kwargs = dict(mission_profile="CUSTOM", duration=25, sampling_rate=1, seed=11)
    o320 = generate_telemetry(engine_model="O320_CLASS", **kwargs)
    rotax = generate_telemetry(engine_model="ROTAX914_CLASS", **kwargs)
    ae = generate_telemetry(engine_model="AE300_CLASS", **kwargs)
    assert not math.isclose(o320["rpm"].mean(), rotax["rpm"].mean(), rel_tol=0.05)
    assert not math.isclose(o320["fuel_flow"].mean(), ae["fuel_flow"].mean(), rel_tol=0.02)


def test_twin_labels_on_fault_run():
    df = generate_telemetry(
        duration=50,
        seed=5,
        mission_profile="CUSTOM",
        faults=[{"type": "COOLING_DEGRADATION", "start": 8, "duration": 35, "severity": 0.95, "progression": "gradual"}],
    )
    assert df["health_index"].iloc[12] > df["health_index"].iloc[40]
    assert df["rul"].iloc[12] >= df["rul"].iloc[40]
    assert abs(df["cht_residual"].iloc[40]) > abs(df["cht_residual"].iloc[2])


def test_invalid_parameters():
    with pytest.raises(ConfigError):
        generate_telemetry(duration=0)
    with pytest.raises(ConfigError):
        generate_telemetry(sampling_rate=-1)
    with pytest.raises(ConfigError):
        generate_telemetry(engine_model="NOPE")
    with pytest.raises(ConfigError):
        generate_telemetry(mission_profile="NOPE")
