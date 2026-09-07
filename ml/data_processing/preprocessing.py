"""Reusable preprocessing with train/inference consistency (no leakage)."""

from __future__ import annotations

from pathlib import Path
from typing import Iterable, Sequence

import joblib
import numpy as np
import pandas as pd
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler

from ml.config import ANOMALY_FEATURE_COLUMNS, PREPROCESSOR_PATH
from ml.data_processing.cleaning import clean_telemetry, telemetry_to_frame
from ml.data_processing.feature_engineering import FEATURE_OUTPUT_COLUMNS, engineer_features

DEFAULT_SCALE_COLUMNS = ANOMALY_FEATURE_COLUMNS


class TelemetryPreprocessor:
    """Fit scalers on training data only; reuse the same transform at inference."""

    def __init__(self, feature_columns: Sequence[str] | None = None) -> None:
        self.feature_columns = list(feature_columns or DEFAULT_SCALE_COLUMNS)
        self.imputer = SimpleImputer(strategy="median")
        self.scaler = StandardScaler()
        self._fitted = False

    def _select(self, df: pd.DataFrame) -> pd.DataFrame:
        missing = [c for c in self.feature_columns if c not in df.columns]
        for column in missing:
            df[column] = np.nan
        return df[self.feature_columns]

    def prepare_frame(self, telemetry) -> pd.DataFrame:
        frame = telemetry_to_frame(telemetry)
        cleaned = clean_telemetry(frame)
        return engineer_features(cleaned)

    def fit(self, telemetry) -> "TelemetryPreprocessor":
        featured = self.prepare_frame(telemetry)
        values = self._select(featured)
        self.imputer.fit(values)
        imputed = self.imputer.transform(values)
        self.scaler.fit(imputed)
        self._fitted = True
        return self

    def transform(self, telemetry, scale: bool = True) -> tuple[pd.DataFrame, np.ndarray]:
        featured = self.prepare_frame(telemetry)
        values = self._select(featured)
        if not self._fitted:
            raise RuntimeError("TelemetryPreprocessor must be fit() before transform()")
        imputed = self.imputer.transform(values)
        matrix = self.scaler.transform(imputed) if scale else imputed
        return featured, matrix

    def fit_transform(self, telemetry, scale: bool = True) -> tuple[pd.DataFrame, np.ndarray]:
        self.fit(telemetry)
        return self.transform(telemetry, scale=scale)

    def save(self, path: Path | str = PREPROCESSOR_PATH) -> Path:
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(
            {
                "feature_columns": self.feature_columns,
                "imputer": self.imputer,
                "scaler": self.scaler,
                "fitted": self._fitted,
            },
            path,
        )
        return path

    @classmethod
    def load(cls, path: Path | str = PREPROCESSOR_PATH) -> "TelemetryPreprocessor":
        payload = joblib.load(path)
        instance = cls(feature_columns=payload["feature_columns"])
        instance.imputer = payload["imputer"]
        instance.scaler = payload["scaler"]
        instance._fitted = payload.get("fitted", True)
        return instance


def available_feature_columns(columns: Iterable[str]) -> list[str]:
    present = set(columns)
    return [c for c in FEATURE_OUTPUT_COLUMNS if c in present]
