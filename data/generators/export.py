"""CSV / JSON export for synthetic telemetry."""

from __future__ import annotations

from pathlib import Path

import pandas as pd

from data.schemas.telemetry_schema import TELEMETRY_COLUMNS


def _prepare(df: pd.DataFrame) -> pd.DataFrame:
    out = df.loc[:, TELEMETRY_COLUMNS].copy()
    out["timestamp"] = pd.to_datetime(out["timestamp"], utc=True).dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    return out


def export_csv(df: pd.DataFrame, path: Path) -> Path:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    _prepare(df).to_csv(path, index=False)
    return path


def export_json(df: pd.DataFrame, path: Path) -> Path:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    _prepare(df).to_json(path, orient="records", indent=2)
    return path
