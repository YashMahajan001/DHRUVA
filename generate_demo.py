"""Phase 1 demo: healthy + three fault scenarios for O320_CLASS."""

from __future__ import annotations

import logging
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from data.generators.telemetry_generator import generate_telemetry, write_dataset
from digital_twin.twin import DigitalTwin, export_twin_states


def _summary(title: str, df, extra: str, path) -> None:
    print()
    print(title)
    print(f"  Engine: {df['model_id'].iloc[0]}")
    print(f"  Mission: {df['mission_id'].iloc[0]}")
    print(f"  Duration: {len(df)} sec (1 Hz)")
    print(f"  Samples: {len(df)}")
    print(f"  {extra}")
    print(f"  Output: {path}")


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    print("Simulation completed\n")

    healthy = generate_telemetry(
        engine_model="O320_CLASS",
        mission_profile="HIGH_ALTITUDE_ISR",
        duration=1800,
        sampling_rate=1,
        seed=42,
    )
    csv_h, _ = write_dataset(healthy, "healthy_o320_high_altitude", kind="healthy")
    _summary("1. Healthy O320 high-altitude ISR", healthy, "Fault: none", csv_h)

    cooling = generate_telemetry(
        engine_model="O320_CLASS",
        mission_profile="HIGH_ALTITUDE_ISR",
        duration=1800,
        sampling_rate=1,
        seed=42,
        faults=[
            {
                "type": "COOLING_DEGRADATION",
                "start": 900,
                "duration": 900,
                "severity": 0.7,
                "progression": "gradual",
            }
        ],
    )
    csv_c, _ = write_dataset(cooling, "cooling_degradation_o320", kind="faults")
    _summary(
        "2. Cooling degradation scenario",
        cooling,
        "Fault: COOLING_DEGRADATION | Fault onset: 900 sec",
        csv_c,
    )

    drift = generate_telemetry(
        engine_model="AE300_CLASS",
        mission_profile="LONG_ENDURANCE_LOITER",
        duration=1800,
        sampling_rate=1,
        seed=42,
        faults=[
            {
                "type": "SENSOR_DRIFT",
                "start": 600,
                "duration": 1200,
                "severity": 0.6,
                "progression": "gradual",
                "affected_sensor": "cht",
            }
        ],
    )
    csv_d, _ = write_dataset(drift, "sensor_drift_ae300", kind="faults")
    _summary("3. Sensor drift scenario", drift, "Fault: SENSOR_DRIFT (CHT) | onset: 600 sec", csv_d)

    vib = generate_telemetry(
        engine_model="O320_CLASS",
        mission_profile="RAPID_RESPONSE",
        duration=1800,
        sampling_rate=1,
        seed=42,
        faults=[
            {
                "type": "ABNORMAL_VIBRATION",
                "start": 400,
                "duration": 800,
                "severity": 0.65,
                "progression": "sudden",
            }
        ],
    )
    csv_v, _ = write_dataset(vib, "abnormal_vibration_o320", kind="faults")
    _summary("4. Abnormal vibration scenario", vib, "Fault: ABNORMAL_VIBRATION | onset: 400 sec", csv_v)

    sample = generate_telemetry(
        engine_model="O320_CLASS",
        mission_profile="HIGH_ALTITUDE_ISR",
        duration=60,
        sampling_rate=1,
        seed=42,
        faults=[
            {
                "type": "COOLING_DEGRADATION",
                "start": 30,
                "duration": 30,
                "severity": 0.7,
                "progression": "gradual",
            }
        ],
    )
    csv_s, _ = write_dataset(sample, "sample_cooling_o320_60s", kind="missions")
    print()
    print(f"Sample dataset (60 s): {csv_s}")

    twin = DigitalTwin("O320_CLASS")
    twin_states = twin.process_dataframe(cooling)
    csv_t, json_t = export_twin_states(twin_states, "twin_cooling_o320")
    markers = (0, 900, 1350, 1799)
    print()
    print("5. Digital Twin - cooling degradation")
    for idx in markers:
        st = twin_states[idx]
        print(f"  t={idx:>4}s  health={st.health_index:5.1f}  {st.health_state:<8}  thermal={st.component_health['thermal']:.1f}")
    last = twin_states[-1]
    print(f"  Latest TwinState health_index={last.health_index} health_state={last.health_state}")
    print(f"  Twin CSV: {csv_t}")
    print(f"  Twin JSON: {json_t}")


if __name__ == "__main__":
    main()
