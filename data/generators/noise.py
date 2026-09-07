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
    "manifold_pressure",
    "coolant_temp",
    "fuel_pressure",
    "knock_index",
    "harmonic_freq",
    "vibration_kurtosis",
    "vibration_peak_hz",
    "compression_ratio",
    "valve_clearance",
    "radiator_airflow",
)

# Per-cylinder channels get independent noise from the cht_cylinder / egt_cylinder / cylinder_pressure sigma
PER_CYLINDER_CHANNELS = {
    "cht_cyl": "cht_cylinder",
    "egt_cyl": "egt_cylinder",
    "cyl_pressure": "cylinder_pressure",
}

NON_NEGATIVE_CHANNELS = {
    "rpm",
    "oil_pressure",
    "fuel_flow",
    "vibration_rms",
    "battery_voltage",
    "alternator_current",
    "manifold_pressure",
    "coolant_temp",
    "fuel_pressure",
    "knock_index",
    "harmonic_freq",
    "vibration_kurtosis",
    "vibration_peak_hz",
    "compression_ratio",
    "valve_clearance",
    "radiator_airflow",
}


def apply_sensor_noise(state: HealthyState, noise: EngineNoiseParams, rng: Generator) -> HealthyState:
    """Add independent Gaussian noise; keep physically impossible signs clipped."""
    updates: dict[str, float] = {}
    for channel in NOISE_CHANNELS:
        sigma = float(getattr(noise, channel, 0.0))
        value = float(getattr(state, channel)) + float(rng.normal(0.0, sigma))
        if channel == "throttle":
            value = min(max(value, 0.0), 1.0)
        elif channel in NON_NEGATIVE_CHANNELS:
            value = max(value, 0.0)
        updates[channel] = value

    # Per-cylinder noise (4 cylinders each)
    for prefix, noise_attr in PER_CYLINDER_CHANNELS.items():
        sigma = float(getattr(noise, noise_attr, 0.0))
        for i in range(1, 5):
            field = f"{prefix}_{i}"
            value = float(getattr(state, field)) + float(rng.normal(0.0, sigma))
            updates[field] = max(value, 0.0)

    # Recompute coolant_delta from noisy values
    updates["coolant_delta"] = updates.get("cht", state.cht) - updates.get("coolant_temp", state.coolant_temp)

    return replace(state, **updates)
