"""Mission profile loading and time interpolation."""

from __future__ import annotations

from dataclasses import dataclass

from pydantic import BaseModel, Field

from simulation.config_loader import load_named_config
from simulation.exceptions import ConfigError
from simulation.missions.phases import ALLOWED_PHASES

MISSION_FILES: dict[str, str] = {
    "HIGH_ALTITUDE_ISR": "high_altitude_isr",
    "LONG_ENDURANCE_LOITER": "long_endurance_loiter",
    "RAPID_RESPONSE": "rapid_response",
    "HOT_WEATHER": "hot_weather",
    "MARITIME_PATROL": "maritime_patrol",
    "CUSTOM": "custom",
}


class MissionPhaseSpec(BaseModel):
    phase: str
    duration_frac: float = Field(gt=0.0)
    altitude_m: list[float]
    throttle: list[float]


class MissionProfile(BaseModel):
    mission_id: str
    name: str = ""
    sea_level_temp_c: float = 15.0
    phases: list[MissionPhaseSpec]


@dataclass
class MissionSample:
    phase: str
    altitude_m: float
    throttle: float
    sea_level_temp_c: float


def _lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def get_mission_profile(mission_id: str) -> MissionProfile:
    key = mission_id.strip().upper()
    if key not in MISSION_FILES:
        known = ", ".join(sorted(MISSION_FILES))
        raise ConfigError(f"Unknown mission profile {mission_id!r}. Known: {known}")
    raw = load_named_config("missions", MISSION_FILES[key])
    profile = MissionProfile.model_validate(raw)
    for spec in profile.phases:
        if spec.phase not in ALLOWED_PHASES:
            raise ConfigError(f"Invalid mission phase {spec.phase!r}")
        if len(spec.altitude_m) != 2 or len(spec.throttle) != 2:
            raise ConfigError("Each phase needs altitude_m and throttle as [start, end]")
    return profile


def sample_mission(profile: MissionProfile, t_sec: float, duration_s: float) -> MissionSample:
    """Map mission time to phase, altitude, and throttle via piecewise lerp."""
    if duration_s <= 0:
        raise ConfigError("Mission duration must be positive")
    frac = min(max(t_sec / duration_s, 0.0), 0.999999)
    total = sum(p.duration_frac for p in profile.phases)
    cursor = 0.0
    for spec in profile.phases:
        width = spec.duration_frac / total
        end = cursor + width
        if frac <= end or spec is profile.phases[-1]:
            local = (frac - cursor) / width if width > 0 else 0.0
            local = min(max(local, 0.0), 1.0)
            return MissionSample(
                phase=spec.phase,
                altitude_m=_lerp(spec.altitude_m[0], spec.altitude_m[1], local),
                throttle=_lerp(spec.throttle[0], spec.throttle[1], local),
                sea_level_temp_c=profile.sea_level_temp_c,
            )
        cursor = end
    last = profile.phases[-1]
    return MissionSample(last.phase, last.altitude_m[1], last.throttle[1], profile.sea_level_temp_c)
