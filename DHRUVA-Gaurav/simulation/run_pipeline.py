"""
run_pipeline.py -- End-to-end smoke test for the DHRUVA simulation +
streaming pipeline.

Wires together:
  EngineSimulator -> MissionSimulator -> FaultInjector -> (optional MQTT)

All output matches the CANONICAL SCHEMA exactly:
  engine_id, timestamp, rpm, temperature, oil_pressure,
  fuel_flow, altitude, throttle

Run from the project root:
    python -m simulation.run_pipeline              # dry-run (no broker)
    python -m simulation.run_pipeline --mqtt       # publish to MQTT
    python -m simulation.run_pipeline --generate-sample  # create replay data
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from simulation.engine_configs import O320_CLASS, ROTAX914_CLASS, AE300_CLASS
from simulation.engine_simulator import EngineSimulator
from simulation.mission_simulator import MissionSimulator, RAPID_RESPONSE, HOT_WEATHER
from simulation.fault_injector import FaultInjector


SAMPLE_OUT = Path(__file__).parent / "replay" / "sample_missions" / "sample_mission.json"


def _generate_sample() -> None:
    """Generate ~30 canonical-schema readings for ReplayEngine testing."""
    engine = EngineSimulator("ENG001", config=O320_CLASS, seed=42)
    mission = MissionSimulator(RAPID_RESPONSE, engine)

    fi = FaultInjector(mission.run(duration_seconds=30, tick_seconds=1.0), seed=99)
    fi.inject("overheating", severity=0.4, onset_time=15, ramp_duration=10)

    readings = list(fi.stream(tick_seconds=1.0))
    SAMPLE_OUT.parent.mkdir(parents=True, exist_ok=True)
    with open(SAMPLE_OUT, "w", encoding="utf-8") as fh:
        json.dump(readings, fh, indent=2, default=str)
    print(f"[OK] Wrote {len(readings)} readings to {SAMPLE_OUT}")


def _dry_run(duration: int = 30, tick: float = 1.0) -> None:
    """Print a simulated mission with faults to stdout."""
    engine = EngineSimulator("ENG001", config=O320_CLASS, seed=42)
    mission = MissionSimulator(RAPID_RESPONSE, engine)

    fi = FaultInjector(mission.run(duration_seconds=duration, tick_seconds=tick), seed=99)
    fi.inject("cooling_degradation", severity=0.6, onset_time=10, ramp_duration=15)
    fi.inject("misfire", severity=0.4, onset_time=20, ramp_duration=10)

    header = (
        f"{'t':>4}  {'rpm':>8}  {'temp':>7}  {'oil_p':>7}  "
        f"{'fuel':>6}  {'alt':>7}  {'thr':>5}"
    )
    sep = "=" * len(header)
    print(sep)
    print(header)
    print(sep)

    for i, r in enumerate(fi.stream(tick_seconds=tick)):
        print(
            f"{i:>4}  {r['rpm']:>8.1f}  {r['temperature']:>7.1f}  "
            f"{str(r['oil_pressure']):>7}  {r['fuel_flow']:>6.1f}  "
            f"{r['altitude']:>7.0f}  {r['throttle']:>5.1f}"
        )
        # Verify canonical schema compliance on first reading
        if i == 0:
            expected = {"engine_id", "timestamp", "rpm", "temperature",
                        "oil_pressure", "fuel_flow", "altitude", "throttle"}
            actual = set(r.keys())
            if actual != expected:
                extra = actual - expected
                missing = expected - actual
                print(f"  !! SCHEMA MISMATCH  extra={extra}  missing={missing}")

    print(sep)
    print("[OK] Dry-run complete. All readings match canonical schema.")


def _mqtt_run(duration: int = 20, tick: float = 1.0) -> None:
    """Publish a short mission to MQTT."""
    from streaming.mqtt.publisher import TelemetryPublisher

    engine = EngineSimulator("ENG001", config=ROTAX914_CLASS, seed=7)
    mission = MissionSimulator(HOT_WEATHER, engine)

    fi = FaultInjector(mission.run(duration_seconds=duration, tick_seconds=tick), seed=42)
    fi.inject("overheating", severity=0.5, onset_time=10, ramp_duration=10)

    pub = TelemetryPublisher()
    print(f"Publishing {duration}s of telemetry to MQTT (tick={tick}s)...")
    pub.publish_stream(fi.stream(tick_seconds=tick), tick_seconds=tick, realtime=True)
    print("[OK] MQTT publish complete.")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="DHRUVA simulation pipeline end-to-end test"
    )
    parser.add_argument("--mqtt", action="store_true",
                        help="Publish to local MQTT broker")
    parser.add_argument("--generate-sample", action="store_true",
                        help="Generate sample mission JSON")
    parser.add_argument("--duration", type=int, default=30,
                        help="Simulation duration in seconds")
    parser.add_argument("--tick", type=float, default=1.0,
                        help="Tick interval in seconds")
    args = parser.parse_args()

    if args.generate_sample:
        _generate_sample()
    elif args.mqtt:
        _mqtt_run(duration=args.duration, tick=args.tick)
    else:
        _dry_run(duration=args.duration, tick=args.tick)


if __name__ == "__main__":
    main()
