"""In-memory telemetry fixtures + CSV loading for ML training/tests.

This is not Yash's telemetry generator. It produces compact labeled windows
so Isolation Forest / classifiers / tests can run on this branch.  When
``data/synthetic/`` CSVs exist, training scripts should prefer those via
:func:`load_external_dataset`, which correctly excludes the Digital Twin
CSV (different schema) and validates required columns.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from pathlib import Path

import numpy as np
import pandas as pd

from ml.config import FAULT_CLASSES, RANDOM_STATE
from ml.schema import TELEMETRY_CSV_COLUMNS, TWIN_CSV_COLUMNS

TELEMETRY_CSV_GLOBS = (
    "data/synthetic/faults/**/*.csv",
    "data/synthetic/healthy/**/*.csv",
)

# Explicitly excluded — the Digital Twin CSV has a different schema.
TWIN_CSV_DIR = "data/synthetic/twin"
TWIN_CSV_NAME = "twin_cooling_o320.csv"

# Columns without which the telemetry pipeline cannot operate.  Unknown/new
# columns are kept but logged; missing required columns raise a clear error.
REQUIRED_TELEMETRY_COLUMNS = [
    "timestamp",
    "engine_id",
    "fault_label",
    "health_index",
    "rul",
]


def load_external_dataset(root: Path | None = None) -> pd.DataFrame | None:
    """Concatenate telemetry CSVs (faults + healthy) into one training frame.

    The Digital Twin CSV is deliberately excluded — it has a different schema
    and is consumed separately (see ``ml/twin_adapter.py``).
    """
    base = root or Path.cwd()
    frames: list[pd.DataFrame] = []
    loaded_paths: list[Path] = []
    for pattern in TELEMETRY_CSV_GLOBS:
        for path in sorted(base.glob(pattern)):
            if TWIN_CSV_DIR in path.parts and path.name == TWIN_CSV_NAME:
                continue
            if path.name == TWIN_CSV_NAME:
                continue
            try:
                df = pd.read_csv(path)
            except Exception as exc:  # pragma: no cover - file read error
                continue
            missing = [c for c in REQUIRED_TELEMETRY_COLUMNS if c not in df.columns]
            if missing:
                print(f"[load_external_dataset] SKIP {path.name}: missing {missing}")
                continue
            frames.append(df)
            loaded_paths.append(path)
    if not frames:
        return None
    combined = pd.concat(frames, ignore_index=True)
    unexpected = sorted(set(combined.columns) - set(TELEMETRY_CSV_COLUMNS))
    if unexpected:
        print(
            f"[load_external_dataset] NOTE: unexpected columns kept: {unexpected}"
        )
    print(f"[load_external_dataset] Loaded {len(loaded_paths)} CSV(s): {[p.name for p in loaded_paths]}")
    return combined


def load_twin_dataset(root: Path | None = None) -> pd.DataFrame | None:
    """Load the Digital Twin CSV separately (different schema)."""
    base = root or Path.cwd()
    twin_glob = base / TWIN_CSV_DIR / TWIN_CSV_NAME
    if not twin_glob.exists():
        return None
    df = pd.read_csv(twin_glob)
    missing = [c for c in TWIN_CSV_COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(f"Digital Twin CSV missing required columns: {missing}")
    return df


def _base_row(i: int, engine_id: str, model_id: str, start: datetime) -> dict:
    t = start + timedelta(seconds=i)
    throttle = 55.0 + 8.0 * np.sin(i / 40.0)
    rpm = 2400 + throttle * 18 + np.random.normal(0, 12)
    return {
        "timestamp": t.isoformat(),
        "engine_id": engine_id,
        "model_id": model_id,
        "altitude": 4500 + 40 * np.sin(i / 80.0),
        "ambient_temperature": 5.0 - (4500 / 1000.0) * 2.0,
        "rpm": rpm,
        "throttle": throttle,
        "cht": 185 + 0.02 * throttle + np.random.normal(0, 1.2),
        "egt": 720 + 0.8 * throttle + np.random.normal(0, 4),
        "oil_pressure": 48 + rpm / 400 + np.random.normal(0, 0.4),
        "oil_temperature": 95 + 0.05 * throttle + np.random.normal(0, 0.6),
        "fuel_flow": 12 + throttle * 0.08 + np.random.normal(0, 0.15),
        "vibration_rms": 1.1 + np.random.normal(0, 0.08),
        "battery_voltage": 28.0 + np.random.normal(0, 0.05),
        "alternator_current": 18.0 + np.random.normal(0, 0.3),
        "injection_timing": 8.0,
        "mission_phase": "cruise",
        "fault_label": "healthy",
        "health_index": 96.0,
        "rul": 96.0,
        "cht_residual": np.random.normal(0, 1.0),
        "egt_residual": np.random.normal(0, 2.0),
        "oil_pressure_residual": np.random.normal(0, 0.3),
        "fuel_flow_residual": np.random.normal(0, 0.1),
    }


def _apply_fault(row: dict, fault: str, progress: float) -> dict:
    p = max(0.0, min(1.0, progress))
    row = dict(row)
    row["fault_label"] = fault
    if fault == "healthy":
        return row
    if fault == "cooling_degradation":
        row["cht"] += 35 * p
        row["egt"] += 40 * p
        row["cht_residual"] = 8 + 30 * p
        row["egt_residual"] = 10 + 25 * p
        row["health_index"] = 94 - 30 * p
    elif fault == "overheating":
        row["cht"] += 55 * p
        row["egt"] += 90 * p
        row["health_index"] = 90 - 45 * p
    elif fault == "injector_degradation":
        row["fuel_flow"] += 4 * p
        row["egt"] += 50 * p
        row["health_index"] = 92 - 22 * p
    elif fault == "misfire":
        row["rpm"] += np.random.normal(0, 80 * p)
        row["egt"] += np.random.normal(0, 40 * p)
        row["health_index"] = 91 - 20 * p
    elif fault == "lubrication_loss":
        row["oil_pressure"] -= 18 * p
        row["oil_temperature"] += 15 * p
        row["health_index"] = 90 - 35 * p
    elif fault == "abnormal_vibration":
        row["vibration_rms"] += 6 * p
        row["health_index"] = 93 - 18 * p
    elif fault == "alternator_degradation":
        row["alternator_current"] -= 10 * p
        row["battery_voltage"] -= 2 * p
        row["health_index"] = 94 - 12 * p
    elif fault == "sensor_bias":
        row["cht"] += 18
        row["cht_residual"] = 18
        row["health_index"] = 88 - 8 * p
    elif fault == "sensor_drift":
        row["cht"] += 25 * p
        row["cht_residual"] = 25 * p
        row["health_index"] = 90 - 10 * p
    elif fault == "sensor_dropout":
        row["cht"] = np.nan
        row["health_index"] = 85
    row["rul"] = max(5.0, float(row["health_index"]))
    return row


def make_training_dataset(
    rows_per_class: int = 80,
    seed: int = RANDOM_STATE,
) -> pd.DataFrame:
    np.random.seed(seed)
    start = datetime(2026, 1, 1, tzinfo=timezone.utc)
    records: list[dict] = []
    i = 0
    for fault in FAULT_CLASSES:
        for step in range(rows_per_class):
            row = _base_row(i, "ENG001", "ROTAX914_CLASS", start)
            progress = 0.0 if fault == "healthy" else (step + 1) / rows_per_class
            records.append(_apply_fault(row, fault, progress))
            i += 1
    return pd.DataFrame(records)


def make_cooling_demo_sequence(n_healthy: int = 40, n_fault: int = 40) -> list[dict]:
    np.random.seed(RANDOM_STATE)
    start = datetime(2026, 1, 1, tzinfo=timezone.utc)
    rows: list[dict] = []
    for i in range(n_healthy):
        rows.append(_apply_fault(_base_row(i, "UAV-ENG-001", "ROTAX914_CLASS", start), "healthy", 0.0))
    for j in range(n_fault):
        i = n_healthy + j
        rows.append(
            _apply_fault(
                _base_row(i, "UAV-ENG-001", "ROTAX914_CLASS", start),
                "cooling_degradation",
                (j + 1) / n_fault,
            )
        )
    return rows