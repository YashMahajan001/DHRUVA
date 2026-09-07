"""Telemetry cleaning: missing values, duplicates, ranges, validity flags."""

from __future__ import annotations

import logging
from typing import Any

import numpy as np
import pandas as pd

from ml.schema import CANONICAL_FIELDS, COLUMN_ALIASES, TELEMETRY_RANGES, TWIN_RESIDUAL_ALIASES

logger = logging.getLogger(__name__)

_NUMERIC_CANDIDATES = [
    "altitude",
    "ambient_temperature",
    "rpm",
    "throttle",
    "cht",
    "egt",
    "oil_pressure",
    "oil_temperature",
    "fuel_flow",
    "vibration_rms",
    "battery_voltage",
    "alternator_current",
    "injection_timing",
    "health_index",
    "rul",
    "cht_residual",
    "egt_residual",
    "oil_pressure_residual",
    "fuel_flow_residual",
    "rpm_residual",
    "vibration_rms_residual",
]


def normalize_column_names(df: pd.DataFrame) -> pd.DataFrame:
    """Map known aliases onto the canonical ML column names."""
    rename_map: dict[str, str] = {}
    for column in df.columns:
        if column in COLUMN_ALIASES:
            rename_map[column] = COLUMN_ALIASES[column]
        elif column in TWIN_RESIDUAL_ALIASES:
            rename_map[column] = TWIN_RESIDUAL_ALIASES[column]
    if rename_map:
        df = df.rename(columns=rename_map)
        # If both alias and canonical existed, keep the first occurrence.
        df = df.loc[:, ~df.columns.duplicated()]
    return df


def _ensure_core_columns(df: pd.DataFrame) -> pd.DataFrame:
    for field in CANONICAL_FIELDS:
        if field not in df.columns:
            df[field] = np.nan
    return df


def _coerce_numeric(df: pd.DataFrame) -> pd.DataFrame:
    for column in _NUMERIC_CANDIDATES:
        if column in df.columns:
            df[column] = pd.to_numeric(df[column], errors="coerce")
    return df


def _parse_timestamps(df: pd.DataFrame) -> pd.DataFrame:
    if "timestamp" not in df.columns:
        return df
    parsed = pd.to_datetime(df["timestamp"], errors="coerce", utc=True)
    invalid_mask = parsed.isna() & df["timestamp"].notna()
    df["timestamp"] = parsed
    df.loc[invalid_mask, "timestamp_invalid"] = True
    return df


def _flag_range_violations(df: pd.DataFrame) -> pd.DataFrame:
    range_invalid = pd.Series(False, index=df.index)
    for column, (low, high) in TELEMETRY_RANGES.items():
        if column not in df.columns:
            continue
        values = df[column]
        out_of_range = values.notna() & ((values < low) | (values > high))
        df.loc[out_of_range, f"{column}_out_of_range"] = True
        range_invalid = range_invalid | out_of_range
        # Clip extreme outliers for model input while keeping a validity flag.
        df.loc[out_of_range, column] = np.clip(values[out_of_range], low, high)
    df["range_invalid"] = range_invalid
    return df


def _handle_missing(df: pd.DataFrame, original_sensors: list[str] | None = None) -> pd.DataFrame:
    sensor_cols = [c for c in _NUMERIC_CANDIDATES if c in df.columns and not c.endswith("_residual")]
    counted = original_sensors if original_sensors else sensor_cols
    counted = [c for c in counted if c in df.columns]
    df["missing_sensor_count"] = df[counted].isna().sum(axis=1) if counted else 0
    df["sensor_dropout_flag"] = df["missing_sensor_count"] > 0

    group_keys = [c for c in ("engine_id",) if c in df.columns]
    if group_keys:
        df = df.sort_values(group_keys + (["timestamp"] if "timestamp" in df.columns else []))
        df[sensor_cols] = df.groupby(group_keys, dropna=False)[sensor_cols].ffill()
    else:
        df[sensor_cols] = df[sensor_cols].ffill()

    df[sensor_cols] = df[sensor_cols].interpolate(limit=3, limit_direction="both")
    df[sensor_cols] = df[sensor_cols].fillna(df[sensor_cols].median(numeric_only=True))
    return df


def _drop_duplicates(df: pd.DataFrame) -> pd.DataFrame:
    subset = [c for c in ("timestamp", "engine_id") if c in df.columns]
    if not subset:
        return df.drop_duplicates()
    before = len(df)
    df = df.drop_duplicates(subset=subset, keep="last")
    dropped = before - len(df)
    if dropped:
        logger.info("Dropped %s duplicate telemetry rows", dropped)
    return df


def clean_telemetry(df: pd.DataFrame) -> pd.DataFrame:
    """Return a cleaned copy with validity flags. Does not mutate the input."""
    if df is None or df.empty:
        empty = pd.DataFrame(columns=CANONICAL_FIELDS)
        empty["data_valid"] = pd.Series(dtype=bool)
        return empty

    cleaned = df.copy()
    cleaned = normalize_column_names(cleaned)
    original_sensors = [
        c for c in _NUMERIC_CANDIDATES if c in cleaned.columns and not c.endswith("_residual")
    ]
    cleaned = _ensure_core_columns(cleaned)
    cleaned["timestamp_invalid"] = False
    cleaned = _parse_timestamps(cleaned)
    cleaned = _coerce_numeric(cleaned)
    cleaned = _drop_duplicates(cleaned)
    cleaned = _flag_range_violations(cleaned)
    cleaned = _handle_missing(cleaned, original_sensors=original_sensors)

    if "fault_label" in cleaned.columns:
        cleaned["fault_label"] = (
            cleaned["fault_label"].astype("string").fillna("healthy").str.strip().str.lower()
        )
        cleaned.loc[cleaned["fault_label"].isin(["nan", "none", "null", ""]), "fault_label"] = "healthy"

    if "engine_id" in cleaned.columns:
        cleaned["engine_id"] = cleaned["engine_id"].astype("string").fillna("UNKNOWN")
    if "model_id" in cleaned.columns:
        cleaned["model_id"] = cleaned["model_id"].astype("string")

    cleaned["data_valid"] = ~(
        cleaned.get("timestamp_invalid", False)
        | cleaned.get("range_invalid", False)
        | (cleaned.get("missing_sensor_count", 0) > 3)
    )
    return cleaned.reset_index(drop=True)


def telemetry_to_frame(telemetry: Any) -> pd.DataFrame:
    """Accept a dict, list of dicts, or DataFrame."""
    if isinstance(telemetry, pd.DataFrame):
        return telemetry.copy()
    if isinstance(telemetry, dict):
        return pd.DataFrame([telemetry])
    if isinstance(telemetry, list):
        return pd.DataFrame(telemetry)
    raise TypeError("telemetry must be a dict, list of dicts, or pandas DataFrame")
