"""Configurable representative piston-engine model (synthetic)."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field

from simulation.config_loader import load_named_config
from simulation.exceptions import ConfigError


class EngineNoiseParams(BaseModel):
    rpm: float = 8.0
    throttle: float = 0.002
    cht: float = 1.2
    egt: float = 2.5
    oil_pressure: float = 0.4
    oil_temp: float = 0.8
    fuel_flow: float = 0.05
    vibration_rms: float = 0.04
    battery_voltage: float = 0.03
    alternator_current: float = 0.25
    injection_timing: float = 0.15
    altitude: float = 1.5
    ambient_temp: float = 0.15


class EngineParams(BaseModel):
    """Representative coefficients. Not certified operational limits."""

    model_id: str
    display_name: str = ""
    disclaimer: str = ""
    power_class_hp: float = 100.0
    idle_rpm: float
    nominal_rpm: float
    max_rpm: float
    rpm_response: float = 0.25
    power_factor: float = 1.0
    fuel_efficiency_factor: float = 1.0
    idle_fuel_flow: float
    fuel_flow_gain: float
    thermal_factor: float = 1.0
    cooling_factor: float = 1.0
    cht_gain: float
    egt_base: float
    egt_gain: float
    oil_factor: float = 1.0
    oil_pressure_idle: float
    oil_pressure_gain: float
    oil_thermal_gain: float
    vibration_factor: float = 1.0
    vibration_base: float = 0.15
    electrical_generation_factor: float = 1.0
    battery_nominal: float = 14.0
    alternator_current_gain: float = 18.0
    injection_timing_baseline: float = 20.0
    injection_timing_rpm_gain: float = 8.0
    noise: EngineNoiseParams = Field(default_factory=EngineNoiseParams)


class BaseEngineModel:
    """Shared engine behaviour driven by JSON configuration."""

    model_id: str = "BASE"
    config_stem: str = ""

    def __init__(self, params: EngineParams | None = None, overrides: dict[str, Any] | None = None):
        if params is None:
            raw = load_named_config("engines", self.config_stem or self.model_id.lower())
            if overrides:
                raw = {**raw, **overrides}
            params = EngineParams.model_validate(raw)
        if params.model_id != self.model_id:
            raise ConfigError(
                f"Config model_id {params.model_id!r} does not match class {self.model_id!r}"
            )
        self.params = params

    def __repr__(self) -> str:
        return f"{self.__class__.__name__}(model_id={self.model_id})"
