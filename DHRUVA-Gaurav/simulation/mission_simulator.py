"""
mission_simulator.py -- Drives an EngineSimulator through a time-varying
mission profile, yielding telemetry dicts matching the canonical schema.

FIELDS NOT IN CURRENT CANONICAL SCHEMA (may be added later):
    mission_phase   -- the profile internally tracks phase names for
                       altitude/throttle lookup, but does NOT emit them
                       since the backend schema has no mission_phase field.
    ambient_temp    -- profiles could define ambient curves but the
                       canonical schema only has a single 'temperature'
                       (engine temp), not ambient.
    cht, egt        -- separate cylinder-head / exhaust temps; currently
                       collapsed into one 'temperature' field.
    oil_temp        -- not tracked in current schema.
    vibration_rms   -- not tracked.
    battery_voltage, alternator_current -- not tracked.
    injection_timing -- not tracked.
    fault_label, health_index, rul -- not tracked.

TODO: If mission_phase is added back to the schema, emit it from each
      reading using the phase["name"] value below.
"""

from __future__ import annotations

from typing import Any, Dict, Generator, List, Optional

from simulation.engine_simulator import EngineSimulator
from simulation.engine_configs import O320_CLASS


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _ramp(t_norm: float, start: float, end: float) -> float:
    """Linear ramp from *start* to *end* over normalised time 0 -> 1."""
    return start + (end - start) * max(0.0, min(1.0, t_norm))


# ---------------------------------------------------------------------------
# Built-in mission profiles
# ---------------------------------------------------------------------------
# Each profile is a list of phase segments.  Altitude is in metres,
# throttle is 0-100 %.

HIGH_ALTITUDE_ISR: dict = {
    "name": "High-Altitude ISR",
    "phases": [
        {"name": "takeoff",  "duration": 120,  "altitude": [0, 300],     "throttle": [95, 90]},
        {"name": "climb",    "duration": 600,  "altitude": [300, 7620],  "throttle": [85, 80]},
        {"name": "cruise",   "duration": 300,  "altitude": [7620, 7620], "throttle": [65, 65]},
        {"name": "loiter",   "duration": 3600, "altitude": [7620, 7620], "throttle": [55, 55]},
        {"name": "descent",  "duration": 600,  "altitude": [7620, 300],  "throttle": [30, 25]},
        {"name": "landing",  "duration": 120,  "altitude": [300, 0],     "throttle": [25, 10]},
    ],
}

LONG_ENDURANCE: dict = {
    "name": "Long-Endurance Patrol",
    "phases": [
        {"name": "takeoff",  "duration": 90,   "altitude": [0, 200],     "throttle": [90, 85]},
        {"name": "climb",    "duration": 400,  "altitude": [200, 4500],  "throttle": [80, 75]},
        {"name": "cruise",   "duration": 600,  "altitude": [4500, 4500], "throttle": [55, 55]},
        {"name": "loiter",   "duration": 7200, "altitude": [4500, 4500], "throttle": [45, 45]},
        {"name": "descent",  "duration": 400,  "altitude": [4500, 200],  "throttle": [25, 20]},
        {"name": "landing",  "duration": 90,   "altitude": [200, 0],     "throttle": [20, 8]},
    ],
}

RAPID_RESPONSE: dict = {
    "name": "Rapid Response / Strike",
    "phases": [
        {"name": "takeoff",  "duration": 60,   "altitude": [0, 400],     "throttle": [100, 95]},
        {"name": "climb",    "duration": 300,  "altitude": [400, 5000],  "throttle": [92, 88]},
        {"name": "cruise",   "duration": 900,  "altitude": [5000, 5000], "throttle": [85, 85]},
        {"name": "loiter",   "duration": 600,  "altitude": [5000, 5000], "throttle": [50, 50]},
        {"name": "descent",  "duration": 300,  "altitude": [5000, 400],  "throttle": [30, 22]},
        {"name": "landing",  "duration": 60,   "altitude": [400, 0],     "throttle": [22, 8]},
    ],
}

HOT_WEATHER: dict = {
    "name": "Hot-Weather Operations",
    "phases": [
        {"name": "takeoff",  "duration": 120,  "altitude": [0, 250],     "throttle": [95, 90]},
        {"name": "climb",    "duration": 480,  "altitude": [250, 3000],  "throttle": [82, 78]},
        {"name": "cruise",   "duration": 600,  "altitude": [3000, 3000], "throttle": [60, 60]},
        {"name": "loiter",   "duration": 3600, "altitude": [3000, 3000], "throttle": [50, 50]},
        {"name": "descent",  "duration": 480,  "altitude": [3000, 250],  "throttle": [28, 22]},
        {"name": "landing",  "duration": 120,  "altitude": [250, 0],     "throttle": [22, 8]},
    ],
}

MISSION_PROFILES: Dict[str, dict] = {
    "high_altitude_isr": HIGH_ALTITUDE_ISR,
    "long_endurance": LONG_ENDURANCE,
    "rapid_response": RAPID_RESPONSE,
    "hot_weather": HOT_WEATHER,
}


# ---------------------------------------------------------------------------
# Mission Simulator
# ---------------------------------------------------------------------------

class MissionSimulator:
    """
    Drives throttle/altitude over time according to a mission profile
    and yields canonical telemetry dicts.

    Parameters
    ----------
    mission_profile : dict   A profile dict (see built-ins above).
    engine_simulator : EngineSimulator   Pre-constructed engine instance.
    """

    def __init__(self, mission_profile: dict, engine_simulator: EngineSimulator):
        self.profile = mission_profile
        self.engine = engine_simulator
        self._phases: List[dict] = mission_profile["phases"]

    def _total_duration(self) -> float:
        return sum(p["duration"] for p in self._phases)

    def _resolve_phase(self, elapsed: float):
        """Return (phase_dict, t_norm) for the given elapsed time."""
        acc = 0.0
        for phase in self._phases:
            if elapsed < acc + phase["duration"]:
                t_norm = (elapsed - acc) / max(1e-6, phase["duration"])
                return phase, t_norm
            acc += phase["duration"]
        return self._phases[-1], 1.0

    def run(
        self,
        duration_seconds: Optional[float] = None,
        tick_seconds: float = 1.0,
    ) -> Generator[Dict[str, Any], None, None]:
        """
        Yield canonical telemetry dicts at every *tick_seconds* interval.
        """
        total = duration_seconds if duration_seconds is not None else self._total_duration()
        elapsed = 0.0

        while elapsed <= total:
            phase, t_norm = self._resolve_phase(elapsed)
            altitude = _ramp(t_norm, *phase["altitude"])
            throttle = _ramp(t_norm, *phase["throttle"])

            reading = self.engine.step(
                dt=tick_seconds,
                throttle=throttle,
                altitude=altitude,
            )
            yield reading
            elapsed += tick_seconds


# ---------------------------------------------------------------------------
# CLI smoke test
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import json

    engine = EngineSimulator("ENG001", config=O320_CLASS, seed=7)
    mission = MissionSimulator(RAPID_RESPONSE, engine)

    print(f"Mission: {RAPID_RESPONSE['name']}")
    for i, reading in enumerate(mission.run(duration_seconds=20, tick_seconds=1.0)):
        print(
            f"t={i:>4}s | alt={reading['altitude']:>7.0f}m | "
            f"thr={reading['throttle']:.1f}% | RPM={reading['rpm']:>7.1f} | "
            f"temp={reading['temperature']:.1f}C | "
            f"oil_p={reading['oil_pressure']:.1f}psi"
        )
