"""End-to-end ML demo: healthy cruise then cooling degradation."""

from __future__ import annotations

import json

from ml.inference.inference_service import run_inference
from ml.utils.sample_data import make_cooling_demo_sequence


def main() -> None:
    sequence = make_cooling_demo_sequence()
    healthy = run_inference(sequence[:25])
    degraded = run_inference(sequence)
    print("=== HEALTHY WINDOW ===")
    print(json.dumps(healthy, indent=2))
    print("\n=== AFTER COOLING DEGRADATION ===")
    print(json.dumps(degraded, indent=2))


if __name__ == "__main__":
    main()
