"""Per-channel Gaussian sensor noise (configurable, seed-driven)."""

from __future__ import annotations

from dataclasses import replace

from numpy.random import Generator

from digital_twin.engines.base_engine import EngineNoiseParams
from digital_twin.physics.relationships import HealthyState

NOISE_CHANNELS = (
    "altitude",
    "ambient_temp",
    "rpm",
    "throttle",
    "cht",
    "egt",
    "oil_pressure",
    "oil_temp",
    "fuel_flow",
    "vibration_rms",
    "battery_voltage",
    "alternator_current",
    "injection_timing",
)


def apply_sensor_noise(state: HealthyState, noise: EngineNoiseParams, rng: Generator) -> HealthyState:
    """Add independent Gaussian noise; keep physically impossible signs clipped."""
    updates: dict[str, float] = {}
    for channel in NOISE_CHANNELS:
        sigma = float(getattr(noise, channel, 0.0))
        value = float(getattr(state, channel)) + float(rng.normal(0.0, sigma))
        if channel == "throttle":
            value = min(max(value, 0.0), 1.0)
        elif channel in {
            "rpm",
            "oil_pressure",
            "fuel_flow",
            "vibration_rms",
            "battery_voltage",
            "alternator_current",
        }:
            value = max(value, 0.0)
        updates[channel] = value
    return replace(state, **updates)
