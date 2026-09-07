"""Physically meaningful features. Residuals are consumed, not recomputed."""

from __future__ import annotations

import numpy as np
import pandas as pd

from ml.config import (
    ELECTRICAL_FEATURES,
    ENGINE_FEATURES,
    MECHANICAL_FEATURES,
    MISSION_FEATURES,
    MIN_ROLLING_PERIODS,
    RESIDUAL_FEATURES,
    ROLLING_WINDOW,
    SENSOR_COLUMNS,
    THERMAL_FEATURES,
)

RATE_SOURCES = {
    "rpm": "rpm_rate_change",
    "cht": "cht_rate_change",
    "egt": "egt_rate_change",
    "oil_temperature": "oil_temperature_rate_change",
    "oil_pressure": "oil_pressure_rate_change",
    "vibration_rms": "vibration_rate_change",
    "fuel_flow": "fuel_flow_rate_change",
    "health_index": "health_index_rate_change",
}

# Secondary rate-change sources (new CSV columns).
ADDITIONAL_RATE_SOURCES = {
    "coolant_temp": "coolant_temp_rate_change",
    "manifold_pressure": "manifold_pressure_rate_change",
    "knock_index": "knock_index_rate_change",
    "vibration_kurtosis": "vibration_kurtosis_rate_change",
}

BASE_FEATURE_COLUMNS = [
    "rpm_rolling_mean",
    "cht_rolling_mean",
    "egt_rolling_mean",
    "oil_pressure_rolling_mean",
    "vibration_rms_rolling_mean",
    "rpm_rolling_std",
    "cht_rolling_std",
    "egt_rolling_std",
    "vibration_rms_rolling_std",
    "cht_rolling_variance",
    "rpm_rate_change",
    "cht_rate_change",
    "egt_rate_change",
    "oil_temperature_rate_change",
    "oil_pressure_rate_change",
    "vibration_rate_change",
    "fuel_efficiency",
    "rpm_throttle_mismatch",
    "cht_egt_residual",
    "oil_pressure_rpm_ratio",
    "cht_ambient_delta",
    "egt_throttle_ratio",
    "vibration_rpm_ratio",
    "physics_prediction_residual",
    "load_response",
    "temperature_response",
]

# Engineered columns from the new CSV parameters.
NEW_FEATURE_COLUMNS = [
    "coolant_temp_rate_change",
    "manifold_pressure_rate_change",
    "knock_index_rate_change",
    "vibration_kurtosis_rate_change",
    "coolant_delta_rate_change",
    "vibration_peak_hz_rate_change",
    "mean_cyl_cht",
    "mean_cyl_egt",
    "mean_cyl_pressure",
    "cht_spread",
    "egt_spread",
    "coolant_thermal_load",
]

FEATURE_OUTPUT_COLUMNS = BASE_FEATURE_COLUMNS + NEW_FEATURE_COLUMNS


def _sorted_groups(df: pd.DataFrame) -> pd.DataFrame:
    sort_cols = [c for c in ("engine_id", "timestamp") if c in df.columns]
    if sort_cols:
        return df.sort_values(sort_cols)
    return df


def _group_key(df: pd.DataFrame) -> pd.Series:
    if "engine_id" in df.columns:
        return df["engine_id"].astype("string").fillna("UNKNOWN")
    return pd.Series("all", index=df.index)


def _rolling(series: pd.Series, window: int, func: str) -> pd.Series:
    rolled = series.rolling(window=window, min_periods=MIN_ROLLING_PERIODS)
    if func == "mean":
        return rolled.mean()
    if func == "std":
        return rolled.std().fillna(0.0)
    if func == "var":
        return rolled.var().fillna(0.0)
    raise ValueError(func)


def _slope(series: pd.Series, window: int) -> pd.Series:
    def _fit(values: np.ndarray) -> float:
        valid = values[~np.isnan(values)]
        if valid.size < 2:
            return 0.0
        x = np.arange(valid.size, dtype=float)
        return float(np.polyfit(x, valid, 1)[0])

    return series.rolling(window=window, min_periods=MIN_ROLLING_PERIODS).apply(_fit, raw=True)


def _add_cylinder_features(featured: pd.DataFrame) -> pd.DataFrame:
    """Mean / spread across cylinder CHT, EGT, and pressure arrays."""
    cht_cols = [f"cht_cyl_{i}" for i in range(1, 5) if f"cht_cyl_{i}" in featured.columns]
    if cht_cols:
        cyl = featured[cht_cols]
        featured["mean_cyl_cht"] = cyl.mean(axis=1)
        featured["cht_spread"] = cyl.max(axis=1) - cyl.min(axis=1)

    egt_cols = [f"egt_cyl_{i}" for i in range(1, 5) if f"egt_cyl_{i}" in featured.columns]
    if egt_cols:
        cyl = featured[egt_cols]
        featured["mean_cyl_egt"] = cyl.mean(axis=1)
        featured["egt_spread"] = cyl.max(axis=1) - cyl.min(axis=1)

    press_cols = [f"cyl_pressure_{i}" for i in range(1, 5) if f"cyl_pressure_{i}" in featured.columns]
    if press_cols:
        featured["mean_cyl_pressure"] = featured[press_cols].mean(axis=1)

    if "coolant_temp" in featured.columns and "coolant_delta" in featured.columns:
        featured["coolant_thermal_load"] = featured["coolant_delta"] * featured.get("radiator_airflow", 1.0).replace(0, np.nan)

    return featured


def engineer_features(df: pd.DataFrame, window: int = ROLLING_WINDOW) -> pd.DataFrame:
    """Add rolling, rate, cross-sensor, residual, and transient features."""
    if df.empty:
        featured = df.copy()
        for column in FEATURE_OUTPUT_COLUMNS:
            featured[column] = pd.Series(dtype=float)
        return featured

    featured = _sorted_groups(df.copy())
    groups = _group_key(featured)

    all_rate_sources = {**RATE_SOURCES, **ADDITIONAL_RATE_SOURCES}
    for source, dest in all_rate_sources.items():
        if source in featured.columns:
            featured[dest] = featured.groupby(groups, sort=False)[source].diff().fillna(0.0)

    if "coolant_delta" in featured.columns:
        featured["coolant_delta_rate_change"] = featured.groupby(groups, sort=False)["coolant_delta"].diff().fillna(0.0)
    if "vibration_peak_hz" in featured.columns:
        featured["vibration_peak_hz_rate_change"] = featured.groupby(groups, sort=False)["vibration_peak_hz"].diff().fillna(0.0)

    rolling_specs = [
        ("rpm", "mean"),
        ("cht", "mean"),
        ("egt", "mean"),
        ("oil_pressure", "mean"),
        ("vibration_rms", "mean"),
        ("rpm", "std"),
        ("cht", "std"),
        ("egt", "std"),
        ("vibration_rms", "std"),
        ("cht", "var"),
    ]
    for source, func in rolling_specs:
        if source not in featured.columns:
            continue
        suffix = {"mean": "rolling_mean", "std": "rolling_std", "var": "rolling_variance"}[func]
        featured[f"{source}_{suffix}"] = featured.groupby(groups, sort=False)[source].transform(
            lambda s, f=func: _rolling(s, window, f)
        )

    if "cht" in featured.columns:
        featured["cht_rolling_slope"] = featured.groupby(groups, sort=False)["cht"].transform(
            lambda s: _slope(s, window)
        )

    rpm = featured.get("rpm", pd.Series(0.0, index=featured.index)).replace(0, np.nan)
    throttle = featured.get("throttle", pd.Series(np.nan, index=featured.index))
    fuel_flow = featured.get("fuel_flow", pd.Series(np.nan, index=featured.index))
    cht = featured.get("cht", pd.Series(np.nan, index=featured.index))
    egt = featured.get("egt", pd.Series(np.nan, index=featured.index))
    oil_pressure = featured.get("oil_pressure", pd.Series(np.nan, index=featured.index))
    vibration = featured.get("vibration_rms", pd.Series(np.nan, index=featured.index))
    ambient = featured.get("ambient_temperature", pd.Series(np.nan, index=featured.index))

    featured["fuel_efficiency"] = fuel_flow / rpm
    expected_rpm = 800.0 + (throttle.fillna(0.0) / 100.0) * 4700.0
    featured["rpm_throttle_mismatch"] = (featured.get("rpm", expected_rpm) - expected_rpm) / expected_rpm.replace(
        0, np.nan
    )
    featured["cht_egt_residual"] = cht - (0.22 * egt)
    featured["oil_pressure_rpm_ratio"] = oil_pressure / rpm
    featured["cht_ambient_delta"] = cht - ambient
    featured["egt_throttle_ratio"] = egt / throttle.replace(0, np.nan)
    featured["vibration_rpm_ratio"] = vibration / rpm
    featured["fuel_flow_rpm_ratio"] = fuel_flow / rpm
    featured["load_response"] = featured.get("rpm_rate_change", 0.0) - (
        featured.get("throttle", 0.0).diff().fillna(0.0) * 20.0
    )
    featured["temperature_response"] = featured.get("cht_rate_change", 0.0) + featured.get(
        "egt_rate_change", 0.0
    )

    residual_cols = [c for c in RESIDUAL_FEATURES if c in featured.columns]
    if residual_cols:
        featured["physics_prediction_residual"] = featured[residual_cols].abs().mean(axis=1)
    else:
        # Twin residuals not supplied: leave a NaN so models do not invent physics.
        featured["physics_prediction_residual"] = np.nan

    featured = _add_cylinder_features(featured)

    clean_cols = list(SENSOR_COLUMNS) + list(FEATURE_OUTPUT_COLUMNS)
    for column in clean_cols:
        if column in featured.columns:
            featured[column] = featured[column].replace([np.inf, -np.inf], np.nan)

    numeric = featured.select_dtypes(include=[np.number]).columns
    featured[numeric] = featured[numeric].fillna(0.0)
    return featured.reset_index(drop=True)