from digital_twin.ml_interface import MLResult
from digital_twin.twin import DigitalTwin
from simulation.engine_simulator import generate_telemetry


def _twin(df, engine="O320_CLASS"):
    twin = DigitalTwin(engine)
    return twin.process_dataframe(df)


def test_healthy_telemetry_high_health():
    df = generate_telemetry(engine_model="O320_CLASS", mission_profile="CUSTOM", duration=40, seed=42)
    states = _twin(df)
    last = states[-1]
    assert last.health_index >= 90
    assert last.health_state == "NORMAL"
    assert 0 <= last.health_index <= 100


def test_cooling_lowers_thermal_health():
    kwargs = dict(engine_model="O320_CLASS", mission_profile="CUSTOM", duration=50, seed=5)
    healthy = _twin(generate_telemetry(**kwargs))
    faulty = _twin(
        generate_telemetry(
            **kwargs,
            faults=[{"type": "COOLING_DEGRADATION", "start": 10, "duration": 30, "severity": 0.9, "progression": "gradual"}],
        )
    )
    assert faulty[-1].component_health["thermal"] < healthy[-1].component_health["thermal"]
    assert faulty[-1].health_index < healthy[-1].health_index


def test_lubrication_fault_affects_lubrication():
    df = generate_telemetry(
        duration=30,
        seed=5,
        mission_profile="CUSTOM",
        faults=[{"type": "LUBRICATION_PRESSURE_LOSS", "start": 10, "duration": 20, "severity": 0.85, "progression": "sudden"}],
    )
    states = _twin(df)
    assert states[-1].component_health["lubrication"] < states[5].component_health["lubrication"]


def test_vibration_affects_mechanical():
    df = generate_telemetry(
        duration=30,
        seed=5,
        mission_profile="CUSTOM",
        faults=[{"type": "ABNORMAL_VIBRATION", "start": 8, "duration": 20, "severity": 0.8, "progression": "sudden"}],
    )
    states = _twin(df)
    assert states[-1].component_health["mechanical"] < states[4].component_health["mechanical"]


def test_sensor_drift_affects_sensor_health():
    kwargs = dict(duration=40, seed=8, mission_profile="CUSTOM")
    healthy = _twin(generate_telemetry(**kwargs))
    drift = _twin(
        generate_telemetry(
            **kwargs,
            faults=[
                {
                    "type": "SENSOR_DRIFT",
                    "start": 5,
                    "duration": 30,
                    "severity": 0.9,
                    "progression": "gradual",
                    "affected_sensor": "cht",
                }
            ],
        )
    )
    assert drift[-1].component_health["sensor"] < healthy[-1].component_health["sensor"]


def test_sudden_fault_changes_state():
    df = generate_telemetry(
        duration=25,
        seed=5,
        mission_profile="CUSTOM",
        faults=[{"type": "OVERHEATING", "start": 12, "duration": 13, "severity": 1.0, "progression": "sudden"}],
    )
    states = _twin(df)
    assert states[11].health_index > states[-1].health_index
    assert states[-1].health_state in {"WATCH", "WARNING", "CRITICAL"}


def test_gradual_fault_degrades():
    df = generate_telemetry(
        duration=50,
        seed=5,
        mission_profile="CUSTOM",
        faults=[{"type": "COOLING_DEGRADATION", "start": 8, "duration": 35, "severity": 0.95, "progression": "gradual"}],
    )
    states = _twin(df)
    assert states[12].health_index > states[40].health_index


def test_health_bounded_and_sequential():
    df = generate_telemetry(duration=20, seed=1, mission_profile="CUSTOM")
    twin = DigitalTwin("O320_CLASS")
    states = twin.process_dataframe(df)
    assert all(0 <= s.health_index <= 100 for s in states)
    assert twin.last_state is states[-1]
    twin.reset()
    again = twin.process_dataframe(df)
    assert [s.health_index for s in states] == [s.health_index for s in again]


def test_optional_ml_blend_does_not_require_models():
    df = generate_telemetry(duration=8, seed=1, mission_profile="CUSTOM")
    twin = DigitalTwin("O320_CLASS")
    physics = twin.process_dataframe(df)
    twin.reset()
    ml = [MLResult(anomaly_probability=0.8, confidence=0.9) for _ in range(len(df))]
    blended = twin.process_dataframe(df, ml_results=ml)
    assert blended[-1].health_index <= physics[-1].health_index
