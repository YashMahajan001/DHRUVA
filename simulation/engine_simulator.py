"""
engine_simulator.py -- Unified synthetic telemetry generator for aero piston engines.

Supports both:
1. Phase 1 dataset generation via ``generate_telemetry`` and ``write_dataset`` (batch DataFrames).
2. Live streaming simulation via ``EngineSimulator.step()`` producing canonical telemetry dictionaries.
"""

from __future__ import annotations

import math
import random
from datetime import datetime, timezone
from typing import Any, Callable, Dict, Optional

# Phase 1 dataset generator exports
from data.generators.telemetry_generator import generate_telemetry, write_dataset
from digital_twin.engines import get_engine_model
from simulation.engine_configs import O320_CLASS

__all__ = [
    "generate_telemetry",
    "write_dataset",
    "get_engine_model",
    "EngineSimulator",
    "default_physics_fn",
]


# ---------------------------------------------------------------------------
# Default (placeholder) physics
# ---------------------------------------------------------------------------

def _lerp(a: float, b: float, t: float) -> float:
    """Linear interpolation clamped to [a, b]."""
    return a + (b - a) * max(0.0, min(1.0, t))


def _first_order_lag(current: float, target: float, dt: float, tau: float) -> float:
    """Exponential first-order lag.  tau is the time constant in seconds."""
    if tau <= 0:
        return target
    alpha = 1.0 - math.exp(-dt / tau)
    return current + alpha * (target - current)


def default_physics_fn(
    state: Dict[str, float],
    dt: float,
    throttle: float,
    altitude: float,
    config: dict,
) -> Dict[str, float]:
    """
    Compute the next noiseless sensor values.

    Parameters
    ----------
    state : dict
        Current state with keys: rpm, temperature, oil_pressure, fuel_flow.
    dt : float
        Elapsed time in seconds since last step.
    throttle : float
        Pilot input [0.0, 1.0].
    altitude : float
        Pressure altitude in feet (>= 0).
    config : dict
        Engine configuration dictionary (e.g. O320_CLASS).

    Returns
    -------
    dict with keys: rpm, temperature, oil_pressure, fuel_flow.
    """
    # 1. Target RPM from throttle
    idle_rpm = config["idle_rpm"]
    max_rpm = config["max_rpm"]
    target_rpm = _lerp(idle_rpm, max_rpm, throttle)

    # Altitude de-rating: naturally aspirated engines lose ~3% power per 1 000 ft
    alt_factor = max(0.0, 1.0 - 0.03 * (altitude / 1000.0))
    target_rpm = idle_rpm + (target_rpm - idle_rpm) * alt_factor

    # Lag on RPM response
    rpm_tau = 1.0 / max(config.get("rpm_response", 0.28), 0.01)
    rpm = _first_order_lag(state["rpm"], target_rpm, dt, rpm_tau)

    # Normalised RPM in [0, 1] relative to operational range
    rpm_norm = max(0.0, min(1.0, (rpm - idle_rpm) / max(max_rpm - idle_rpm, 1)))

    # 2. Fuel flow (L/h)
    idle_ff = config.get("idle_fuel_flow", 8.5)
    ff_gain = config.get("fuel_flow_gain", 22.0)
    target_ff = idle_ff + ff_gain * (throttle ** 1.2)
    fuel_flow = _first_order_lag(state["fuel_flow"], target_ff, dt, 1.5)

    # 3. Temperature (CHT proxy in deg C)
    ambient_temp = 15.0 - 0.00198 * altitude  # Standard atmosphere lapse rate
    cht_gain = config.get("cht_gain", 95.0)
    target_temp = ambient_temp + 60.0 + cht_gain * rpm_norm
    temp_tau = 15.0  # Thermal mass is slow
    temperature = _first_order_lag(state["temperature"], target_temp, dt, temp_tau)

    # 4. Oil pressure (PSI)
    op_idle = config.get("oil_pressure_idle", 25.0)
    op_gain = config.get("oil_pressure_gain", 45.0)
    target_op = op_idle + op_gain * (rpm_norm ** 0.8)
    oil_pressure = _first_order_lag(state["oil_pressure"], target_op, dt, 1.0)

    return {
        "rpm": rpm,
        "temperature": temperature,
        "oil_pressure": oil_pressure,
        "fuel_flow": fuel_flow,
    }


# ---------------------------------------------------------------------------
# Simulator class
# ---------------------------------------------------------------------------

class EngineSimulator:
    """
    Simulates a single aero piston engine over discrete time steps.

    Parameters
    ----------
    engine_id : str
        Unique identifier, e.g. "ENG001".
    config : dict, optional
        Engine config dictionary. Defaults to O320_CLASS.
    physics_fn : callable, optional
        Custom physics function ``(state, dt, throttle, altitude, config) -> state``.
        Defaults to ``default_physics_fn``.
    seed : int, optional
        RNG seed for reproducible sensor noise.
    """

    def __init__(
        self,
        engine_id: str = "ENG001",
        config: Optional[dict] = None,
        physics_fn: Optional[Callable] = None,
        seed: Optional[int] = None,
    ) -> None:
        self.engine_id = engine_id
        self.config = config or O320_CLASS
        self.physics_fn = physics_fn or default_physics_fn
        self._rng = random.Random(seed)

        # Initialise state at cold idle
        idle_rpm = float(self.config["idle_rpm"])
        self.state: Dict[str, float] = {
            "rpm": idle_rpm,
            "temperature": 70.0,
            "oil_pressure": float(self.config.get("oil_pressure_idle", 25.0)),
            "fuel_flow": float(self.config.get("idle_fuel_flow", 8.5)),
        }

    def step(
        self,
        dt: float = 1.0,
        throttle: float = 50.0,
        altitude: float = 0.0,
        timestamp: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        """
        Advance simulation by ``dt`` seconds and return one canonical telemetry reading.

        Parameters
        ----------
        dt : float
            Time step in seconds (e.g. 1.0).
        throttle : float
            Throttle input, accepted as [0, 100] percent or [0, 1] fraction.
        altitude : float
            Altitude in feet (>= 0).
        timestamp : datetime, optional
            Timestamp for the reading. Defaults to UTC now.

        Returns
        -------
        dict matching the canonical schema:
            engine_id, timestamp, rpm, temperature, oil_pressure,
            fuel_flow, altitude, throttle
        """
        # Normalise throttle to [0.0, 1.0] internally
        throttle_pct = max(0.0, min(100.0, float(throttle)))
        throttle_norm = throttle_pct / 100.0
        alt = max(0.0, float(altitude))

        # Advance noiseless physics
        clean_state = self.physics_fn(self.state, dt, throttle_norm, alt, self.config)

        # Update internal persistent state with clean values
        self.state = clean_state

        # Apply Gaussian noise to output reading
        noisy_state = self._add_noise(clean_state)

        ts = timestamp or datetime.now(timezone.utc)
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)

        return {
            "engine_id": self.engine_id,
            "timestamp": ts.isoformat(),
            "rpm": round(max(0.0, noisy_state["rpm"]), 1),
            "temperature": round(noisy_state["temperature"], 2),
            "oil_pressure": round(max(0.0, noisy_state["oil_pressure"]), 2),
            "fuel_flow": round(max(0.0, noisy_state["fuel_flow"]), 2),
            "altitude": round(alt, 1),
            "throttle": round(throttle_pct, 1),
        }

    def _add_noise(self, state: Dict[str, float]) -> Dict[str, float]:
        noise_cfg = self.config.get("noise", {})
        noisy: Dict[str, float] = {}
        for key, val in state.items():
            sigma = noise_cfg.get(key, 0.0)
            noisy[key] = val + self._rng.gauss(0.0, sigma) if sigma else val
        return noisy


# ---------------------------------------------------------------------------
# Quick smoke test
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import json

    sim = EngineSimulator("ENG001", config=O320_CLASS, seed=42)
    for i in range(5):
        reading = sim.step(dt=1.0, throttle=30 + i * 15, altitude=500.0)
        print(json.dumps(reading, indent=2))
