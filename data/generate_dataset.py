"""CLI wrapper: generate synthetic datasets from the public API."""

from __future__ import annotations

import argparse
import logging

from data.faults.fault_types import parse_faults
from data.generators.telemetry_generator import generate_telemetry, write_dataset
from simulation.config_loader import load_named_config


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    parser = argparse.ArgumentParser(description="Generate synthetic aero-piston telemetry")
    parser.add_argument("--engine", default="O320_CLASS")
    parser.add_argument("--mission", default="HIGH_ALTITUDE_ISR")
    parser.add_argument("--duration", type=float, default=120.0)
    parser.add_argument("--rate", type=float, default=1.0)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--fault-config", default=None, help="configs/faults/<name>.json")
    parser.add_argument("--kind", default="healthy", choices=["healthy", "faults", "missions"])
    parser.add_argument("--stem", default="dataset")
    args = parser.parse_args()

    faults = None
    if args.fault_config:
        raw = load_named_config("faults", args.fault_config)
        faults = parse_faults(raw["faults"] if "faults" in raw else [raw])

    df = generate_telemetry(
        engine_model=args.engine,
        mission_profile=args.mission,
        duration=args.duration,
        sampling_rate=args.rate,
        seed=args.seed,
        faults=faults,
    )
    csv_path, json_path = write_dataset(df, args.stem, kind=args.kind)
    print(f"Wrote {len(df)} samples to {csv_path} and {json_path}")


if __name__ == "__main__":
    main()
