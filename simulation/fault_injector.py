"""
fault_injector.py -- Wraps a telemetry generator and injects realistic
faults into the data stream.

CANONICAL SCHEMA CONSTRAINT
----------------------------
The current backend contract defines ONLY these mutable numeric fields:
    rpm, temperature, oil_pressure, fuel_flow
plus non-mutable identifiers (engine_id, timestamp, altitude, throttle).

All fault effects are therefore mapped onto the four mutable fields above.

FIELDS NOT IN CURRENT CANONICAL SCHEMA (DO NOT emit these):
    fault_label     -- would tag which fault is active
    health_index    -- composite health score 0-1
    rul             -- remaining useful life estimate
    vibration_rms   -- would enable abnormal_vibration fault
    cht, egt        -- separate temps; currently collapsed to 'temperature'
    oil_temp        -- would enable oil overheat detection
    battery_voltage, alternator_current -- would enable electrical faults

>>> WARNING: If tests/backend/test_api.py expects fault_label, health_index,
>>> or rul in fault-injected readings, that is a schema mismatch -- flag it
>>> to the backend team rather than silently adding fields that will break
>>> JSON schema validation on the publish/subscribe boundary.

Supported fault types (mapped to available fields)
---------------------------------------------------
  cooling_degradation   temperature trends upward over time
  overheating           temperature rises sharply
  lubrication_issue     oil_pressure drops gradually
  misfire               rpm fluctuates unexpectedly
  injector_degradation  fuel_flow becomes erratic
  sensor_drift          one field slowly biases from true value
  sensor_dropout        a field randomly becomes null
"""

from __future__ import annotations

import random
from typing import Any, Callable, Dict, Generator, List, Optional


# ---------------------------------------------------------------------------
# Fault-effect functions
# ---------------------------------------------------------------------------
# Each receives (reading, severity, progress, rng) and returns the mutated
# reading dict.
#   severity  : 0.0 - 1.0  (intensity at full development)
#   progress  : 0.0 - 1.0  (ramp fraction: 0=onset, 1=fully developed)

def _cooling_degradation(
    reading: dict, severity: float, progress: float, rng: random.Random,
) -> dict:
    reading["temperature"] += severity * progress * 30.0
    return reading


def _overheating(
    reading: dict, severity: float, progress: float, rng: random.Random,
) -> dict:
    reading["temperature"] += severity * progress * 55.0
    return reading


def _lubrication_issue(
    reading: dict, severity: float, progress: float, rng: random.Random,
) -> dict:
    reading["oil_pressure"] *= max(0.1, 1.0 - severity * progress * 0.7)
    return reading


def _misfire(
    reading: dict, severity: float, progress: float, rng: random.Random,
) -> dict:
    drop = severity * progress
    if rng.random() < 0.3 * drop:
        reading["rpm"] -= rng.uniform(50, 300) * drop
    return reading


def _injector_degradation(
    reading: dict, severity: float, progress: float, rng: random.Random,
) -> dict:
    jitter = severity * progress
    reading["fuel_flow"] += rng.gauss(0, 4.0 * jitter)
    return reading


def _sensor_drift(
    reading: dict, severity: float, progress: float, rng: random.Random,
    *, drift_field: str = "temperature", drift_direction: float = 1.0,
) -> dict:
    bias = drift_direction * severity * progress * 20.0
    if drift_field in reading and isinstance(reading[drift_field], (int, float)):
        reading[drift_field] += bias
    return reading


def _sensor_dropout(
    reading: dict, severity: float, progress: float, rng: random.Random,
    *, dropout_field: str = "oil_pressure",
) -> dict:
    if rng.random() < severity * progress * 0.6:
        reading[dropout_field] = None
    return reading


# -- Registry -----------------------------------------------------------------
_FAULT_REGISTRY: Dict[str, Callable] = {
    "cooling_degradation": _cooling_degradation,
    "overheating": _overheating,
    "lubrication_issue": _lubrication_issue,
    "misfire": _misfire,
    "injector_degradation": _injector_degradation,
    "sensor_drift": _sensor_drift,
    "sensor_dropout": _sensor_dropout,
}


# ---------------------------------------------------------------------------
# Fault descriptor (internal)
# ---------------------------------------------------------------------------

class _FaultSpec:
    __slots__ = (
        "fault_type", "severity", "onset_time", "ramp_duration",
        "fault_fn", "extra_kwargs",
    )

    def __init__(self, fault_type, severity, onset_time, ramp_duration,
                 fault_fn, extra_kwargs):
        self.fault_type = fault_type
        self.severity = severity
        self.onset_time = onset_time
        self.ramp_duration = ramp_duration
        self.fault_fn = fault_fn
        self.extra_kwargs = extra_kwargs

    def progress(self, elapsed: float) -> float:
        if elapsed < self.onset_time:
            return 0.0
        if self.ramp_duration <= 0:
            return 1.0
        return min(1.0, (elapsed - self.onset_time) / self.ramp_duration)


# ---------------------------------------------------------------------------
# Fault Injector
# ---------------------------------------------------------------------------

class FaultInjector:
    """
    Wraps a telemetry generator and injects scheduled faults.

    Usage
    -----
    >>> gen = mission_sim.run(duration_seconds=3600)
    >>> fi = FaultInjector(gen)
    >>> fi.inject("overheating", severity=0.8, onset_time=600, ramp_duration=120)
    >>> for reading in fi.stream():
    ...     process(reading)

    Parameters
    ----------
    source : generator   Upstream telemetry generator.
    seed : int, optional   Random seed for reproducibility.
    """

    def __init__(
        self,
        source: Generator[Dict[str, Any], None, None],
        seed: Optional[int] = None,
    ):
        self._source = source
        self._faults: List[_FaultSpec] = []
        self._rng = random.Random(seed)

    def inject(
        self,
        fault_type: str,
        severity: float = 0.5,
        onset_time: float = 0.0,
        ramp_duration: float = 60.0,
        **kwargs,
    ) -> "FaultInjector":
        """
        Schedule a fault.

        Parameters
        ----------
        fault_type : str       One of the registered fault names.
        severity : float       0.0 - 1.0 intensity at full development.
        onset_time : float     Seconds into the mission when fault starts.
        ramp_duration : float  Ramp time (0 = sudden onset).
        **kwargs               Extra args forwarded to the fault function
                               (e.g. drift_field, dropout_field).

        Returns self for chaining.
        """
        if fault_type not in _FAULT_REGISTRY:
            raise ValueError(
                f"Unknown fault type '{fault_type}'. "
                f"Available: {sorted(_FAULT_REGISTRY)}"
            )
        self._faults.append(_FaultSpec(
            fault_type=fault_type,
            severity=max(0.0, min(1.0, severity)),
            onset_time=onset_time,
            ramp_duration=max(0.0, ramp_duration),
            fault_fn=_FAULT_REGISTRY[fault_type],
            extra_kwargs=kwargs,
        ))
        return self

    def stream(
        self, tick_seconds: float = 1.0,
    ) -> Generator[Dict[str, Any], None, None]:
        """Yield telemetry dicts from upstream with faults applied."""
        elapsed = 0.0
        for reading in self._source:
            for spec in self._faults:
                prog = spec.progress(elapsed)
                if prog > 0:
                    reading = spec.fault_fn(
                        reading, spec.severity, prog, self._rng,
                        **spec.extra_kwargs,
                    )
            yield reading
            elapsed += tick_seconds

    @staticmethod
    def available_faults() -> List[str]:
        return sorted(_FAULT_REGISTRY)


# ---------------------------------------------------------------------------
# CLI smoke test
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import json
    from simulation.engine_simulator import EngineSimulator
    from simulation.engine_configs import O320_CLASS
    from simulation.mission_simulator import MissionSimulator, RAPID_RESPONSE

    engine = EngineSimulator("ENG001", config=O320_CLASS, seed=42)
    mission = MissionSimulator(RAPID_RESPONSE, engine)

    fi = FaultInjector(mission.run(duration_seconds=25, tick_seconds=1.0), seed=99)
    fi.inject("overheating", severity=0.7, onset_time=10, ramp_duration=10)

    print("Available faults:", FaultInjector.available_faults())
    for i, r in enumerate(fi.stream(tick_seconds=1.0)):
        print(
            f"t={i:>3}s | temp={r['temperature']:>6.1f} | "
            f"rpm={r['rpm']:>7.1f} | oil_p={str(r['oil_pressure']):>6} | "
            f"fuel={r['fuel_flow']:.1f}"
        )
