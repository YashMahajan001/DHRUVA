"""Fault specifications for synthetic telemetry injection."""

from __future__ import annotations

from typing import Any, Literal, Optional

from pydantic import BaseModel, Field

KNOWN_FAULTS = (
    "INJECTOR_DEGRADATION",
    "COMBUSTION_DISTURBANCE",
    "COOLING_DEGRADATION",
    "LUBRICATION_PRESSURE_LOSS",
    "OVERHEATING",
    "ABNORMAL_VIBRATION",
    "ALTERNATOR_DEGRADATION",
    "BATTERY_DEGRADATION",
    "SENSOR_BIAS",
    "SENSOR_DRIFT",
    "SENSOR_DROPOUT",
)

SENSOR_CHANNELS = (
    "cht",
    "egt",
    "oil_pressure",
    "oil_temp",
    "fuel_flow",
    "vibration_rms",
    "battery_voltage",
    "alternator_current",
    "rpm",
    "throttle",
)


class FaultSpec(BaseModel):
    """One injectable fault instance.

    ``start`` / ``duration`` are seconds from mission t=0.
    ``severity`` is 0-1. ``progression`` is gradual or sudden.
    """

    type: str
    start: float = Field(ge=0.0)
    duration: float = Field(gt=0.0)
    severity: float = Field(ge=0.0, le=1.0, default=0.5)
    progression: Literal["gradual", "sudden"] = "gradual"
    affected_sensor: Optional[str] = None

    def model_post_init(self, __context: Any) -> None:
        fault = self.type.strip().upper()
        object.__setattr__(self, "type", fault)
        if fault not in KNOWN_FAULTS:
            raise ValueError(f"Unknown fault type {self.type!r}")
        if self.affected_sensor:
            object.__setattr__(self, "affected_sensor", self.affected_sensor.strip().lower())
            if self.affected_sensor not in SENSOR_CHANNELS:
                raise ValueError(f"Unknown affected_sensor {self.affected_sensor!r}")


def parse_faults(raw: list[dict[str, Any]] | list[FaultSpec] | None) -> list[FaultSpec]:
    if not raw:
        return []
    out: list[FaultSpec] = []
    for item in raw:
        out.append(item if isinstance(item, FaultSpec) else FaultSpec.model_validate(item))
    return out
