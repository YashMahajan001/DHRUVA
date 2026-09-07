"""TwinState: sequential Digital Twin snapshot."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class ChannelResidual(BaseModel):
    expected: float
    actual: Optional[float] = None
    residual: Optional[float] = None
    norm_residual: Optional[float] = None


class TwinState(BaseModel):
    """Current representative twin snapshot (synthetic prototype)."""

    engine_id: str
    model_id: str
    timestamp: datetime
    mission_phase: str = ""
    mission_id: str = ""
    throttle: float = 0.0
    altitude: float = 0.0
    ambient_temp: float = 0.0
    health_index: float = Field(ge=0.0, le=100.0)
    health_state: str = "NORMAL"
    residuals: dict[str, ChannelResidual]
    component_health: dict[str, float]
    validity_ok: bool = True
    validity_flags: list[str] = Field(default_factory=list)
    ml_fault_class: Optional[str] = None
    ml_confidence: Optional[float] = None

    def to_flat_dict(self) -> dict[str, Any]:
        row: dict[str, Any] = {
            "timestamp": self.timestamp,
            "engine_id": self.engine_id,
            "model_id": self.model_id,
            "mission_id": self.mission_id,
            "mission_phase": self.mission_phase,
            "throttle": self.throttle,
            "altitude": self.altitude,
            "ambient_temp": self.ambient_temp,
            "health_index": self.health_index,
            "health_state": self.health_state,
            "validity_ok": self.validity_ok,
            "validity_flags": ";".join(self.validity_flags),
            "ml_fault_class": self.ml_fault_class,
            "ml_confidence": self.ml_confidence,
        }
        for name, score in self.component_health.items():
            row[f"health_{name}"] = score
        for ch, res in self.residuals.items():
            row[f"expected_{ch}"] = res.expected
            row[f"actual_{ch}"] = res.actual
            row[f"residual_{ch}"] = res.residual
            row[f"norm_residual_{ch}"] = res.norm_residual
        return row
