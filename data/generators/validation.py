"""Integrity checks for synthetic telemetry (not aircraft safety limits)."""

from __future__ import annotations

import pandas as pd

from data.schemas.telemetry_schema import TELEMETRY_COLUMNS
from simulation.config_loader import load_named_config
from simulation.exceptions import ValidationError


NON_NEGATIVE = (
    "rpm",
    "oil_pressure",
    "fuel_flow",
    "vibration_rms",
    "battery_voltage",
    "alternator_current",
)


def validate_telemetry_frame(df: pd.DataFrame) -> None:
    """Raise ValidationError if the frame is structurally or numerically invalid."""
    if df.empty:
        raise ValidationError("Generated telemetry is empty")
    missing = [c for c in TELEMETRY_COLUMNS if c not in df.columns]
    if missing:
        raise ValidationError(f"Missing telemetry columns: {missing}")
    if list(df.columns) != TELEMETRY_COLUMNS:
        raise ValidationError("Telemetry column order does not match canonical schema")

    ts = pd.to_datetime(df["timestamp"], utc=True)
    if not ts.is_monotonic_increasing:
        raise ValidationError("Timestamps must be strictly ordered")

    limits = load_named_config("simulation", "default")["integrity"]
    throttle = df["throttle"].dropna()
    if (throttle < 0).any() or (throttle > limits["throttle_max"]).any():
        raise ValidationError("Throttle outside simulation integrity range")

    rpm = df["rpm"].dropna()
    if (rpm < 0).any() or (rpm > limits["rpm_max"]).any():
        raise ValidationError("RPM outside simulation integrity range")

    for col in NON_NEGATIVE:
        bad = df[col].dropna()
        if (bad < 0).any():
            raise ValidationError(f"{col} contains negative values")

    cht = df["cht"].dropna()
    if (cht < limits["cht_min"]).any() or (cht > limits["cht_max"]).any():
        raise ValidationError("CHT outside simulation integrity range")
    egt = df["egt"].dropna()
    if (egt < limits["egt_min"]).any() or (egt > limits["egt_max"]).any():
        raise ValidationError("EGT outside simulation integrity range")
