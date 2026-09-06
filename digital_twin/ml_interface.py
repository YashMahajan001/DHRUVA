"""Optional ML outputs from later phases (Niranjan). Phase 2 does not compute these."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class MLResult(BaseModel):
    """Validated ML payload the Twin may blend into health scoring.

    All fields are optional. Absence means physics-only health.
    """

    anomaly_probability: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    degradation_estimate: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    fault_class: Optional[str] = None
    rul: Optional[float] = None
    confidence: Optional[float] = Field(default=None, ge=0.0, le=1.0)
