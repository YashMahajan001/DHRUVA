"""
engine_simulator.py -- Synthetic telemetry generator for aero piston engines.

Produces ONE telemetry dict per step() call matching the CANONICAL SCHEMA
exactly (no extra fields):

    engine_id, timestamp, rpm, temperature, oil_pressure,
    fuel_flow, altitude, throttle

All physics relationships are isolated in a single ``physics_fn`` callable
so they can be swapped for a shared physics module later.

NOTE -- Fields present in the full blueprint but NOT in the current
canonical schema (and therefore NOT emitted):
    model_id, ambient_temp, cht, egt, oil_temp, vibration_rms,
    battery_voltage, alternator_current, injection_timing,
    mission_phase, fault_label, health_index, rul
If the backend contract expands to include any of these, add them here.
"""

from __future__ import annotations

import math
import random
from datetime import datetime, timezone
from typing import Any, Callable, Dict, Optional

from simulation.engine_configs import O320_CLASS


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
    state : dict   Mutable dict of current internal values.
    dt : float     Seconds since last step.
    throttle : float   0-100 normalised throttle %.
    altitude : float   Metres above sea level.
    config : dict  Engine configuration preset.

    Returns
    -------
    dict -- updated state (same keys).
    """
    thr_norm = max(0.0, min(1.0, throttle / 100.0))

    # -- altitude density ratio (simplified ISA) ----------------------
    density_ratio = math.exp(-altitude / 8500.0)
    power_factor = density_ratio

    # -- RPM ----------------------------------------------------------
    rpm_target = _lerp(config["idle_rpm"], config["max_rpm"], thr_norm * power_factor)
    state["rpm"] = _first_order_lag(state["rpm"], rpm_target, dt, tau=2.0)

    # -- Temperature (single proxy; trends with throttle/altitude) ----
    temp_target = _lerp(
        config["temp_target_idle"],
        config["temp_target_max_power"],
        thr_norm,
    ) - altitude * 0.002  # slight cooling at altitude
    state["temperature"] = _first_order_lag(
        state["temperature"], temp_target, dt, config["temp_tau"],
    )

    # -- Oil pressure (roughly tracks RPM) ----------------------------
    rpm_norm = (state["rpm"] - config["idle_rpm"]) / max(
        1, config["max_rpm"] - config["idle_rpm"],
    )
    oil_p_target = _lerp(config["oil_pressure_idle"], config["oil_pressure_max"], rpm_norm)
    state["oil_pressure"] = _first_order_lag(state["oil_pressure"], oil_p_target, dt, tau=5.0)

    # -- Fuel flow (RPM * throttle) -----------------------------------
    ff_target = _lerp(config["fuel_flow_idle"], config["fuel_flow_max"], thr_norm * rpm_norm)
    state["fuel_flow"] = _first_order_lag(state["fuel_flow"], ff_target, dt, tau=1.0)

    return state


# ---------------------------------------------------------------------------
# Engine Simulator
# ---------------------------------------------------------------------------

class EngineSimulator:
    """
    Maintains per-engine internal state and advances it one tick at a time.

    Parameters
    ----------
    engine_id : str   Unique identifier (e.g. ``"ENG001"``).
    config : dict     Engine preset (see ``engine_configs.py``).
    physics_fn : callable, optional
        ``(state, dt, throttle, altitude, config) -> state``
        Replaces the built-in placeholder physics.
    seed : int, optional   Random seed for reproducible noise.
    """

    def __init__(
        self,
        engine_id: str,
        config: Optional[dict] = None,
        physics_fn: Optional[Callable[..., Dict[str, float]]] = None,
        seed: Optional[int] = None,
    ):
        self.engine_id = engine_id
        self.config: dict = config or O320_CLASS
        self.physics_fn = physics_fn or default_physics_fn
        self._rng = random.Random(seed)

        # Cold-start state
        self.state: Dict[str, float] = {
            "rpm": float(self.config["idle_rpm"]),
            "temperature": self.config["temp_target_idle"],
            "oil_pressure": self.config["oil_pressure_idle"],
            "fuel_flow": self.config["fuel_flow_idle"],
        }

    # -- public API ----------------------------------------------------

    def step(
        self,
        dt: float,
        throttle: float,
        altitude: float = 0.0,
    ) -> Dict[str, Any]:
        """
        Advance engine state by *dt* seconds and return a telemetry dict
        matching the canonical schema EXACTLY.
        """
        # 1. Physics update (noiseless)
        self.state = self.physics_fn(
            self.state, dt, throttle, altitude, self.config,
        )

        # 2. Sensor noise
        noisy = self._add_noise(self.state)

        # 3. Canonical telemetry message
        return {
            "engine_id": self.engine_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "rpm": round(noisy["rpm"], 1),
            "temperature": round(noisy["temperature"], 1),
            "oil_pressure": round(noisy["oil_pressure"], 1),
            "fuel_flow": round(noisy["fuel_flow"], 1),
            "altitude": round(altitude, 1),
            "throttle": round(throttle, 1),
        }

    def reset(self) -> None:
        """Reset to cold-start state."""
        self.__init__(self.engine_id, self.config, self.physics_fn)

    # -- internals -----------------------------------------------------

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
