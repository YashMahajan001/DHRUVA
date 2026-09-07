"""Sequential representative Digital Twin."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable, Optional, Sequence, Union

import pandas as pd

from digital_twin.engines import get_engine_model
from digital_twin.engines.base_engine import BaseEngineModel
from digital_twin.health import component_scores, health_state_from_index, overall_health_index
from digital_twin.ml_interface import MLResult
from digital_twin.residuals import build_residuals, expected_from_operating
from digital_twin.state import TwinState
from digital_twin.validity import COMPARE_CHANNELS, validate_record, _is_missing
from simulation.config_loader import load_named_config
from simulation.paths import synthetic_data_dir

logger = logging.getLogger("dhruva.twin")

Record = Union[dict[str, Any], pd.Series]


class DigitalTwin:
    """Physics-based twin that updates on each telemetry sample.

    Optional ``ml_result`` is accepted but not produced here.
    """

    def __init__(self, engine_model: Union[str, BaseEngineModel] = "O320_CLASS"):
        self.engine = get_engine_model(engine_model) if isinstance(engine_model, str) else engine_model
        self.cfg = load_named_config("twin", "health")
        self._rpm_prev = self.engine.params.idle_rpm
        self._oil_prev: Optional[float] = None
        self._ema_index: Optional[float] = None
        self._ema_components: dict[str, float] = {}
        self._last: Optional[TwinState] = None
        self._n = 0

    @property
    def last_state(self) -> Optional[TwinState]:
        return self._last

    def reset(self) -> None:
        self._rpm_prev = self.engine.params.idle_rpm
        self._oil_prev = None
        self._ema_index = None
        self._ema_components = {}
        self._last = None
        self._n = 0

    def update(self, telemetry: Record, ml_result: MLResult | dict[str, Any] | None = None) -> TwinState:
        """Ingest one telemetry record and return the new TwinState."""
        row = telemetry.to_dict() if isinstance(telemetry, pd.Series) else dict(telemetry)
        ml = None if ml_result is None else (
            ml_result if isinstance(ml_result, MLResult) else MLResult.model_validate(ml_result)
        )
        altitude = float(row.get("altitude") or 0.0)
        throttle = float(row.get("throttle") or 0.0)
        ambient = float(row.get("ambient_temp") or 15.0)
        if self._oil_prev is None:
            self._oil_prev = ambient + 35.0

        expected = expected_from_operating(
            altitude_m=altitude,
            throttle=throttle,
            ambient_c=ambient,
            rpm_prev=self._rpm_prev,
            oil_temp_prev=self._oil_prev,
            params=self.engine.params,
        )
        self._rpm_prev = expected.rpm
        self._oil_prev = expected.oil_temp

        residuals = build_residuals(expected, row, self.cfg["residual_scales"])
        norm = {k: (v.norm_residual or 0.0) for k, v in residuals.items() if v.norm_residual is not None}
        missing = sum(1 for ch in COMPARE_CHANNELS if _is_missing(row.get(ch)))
        dq = float(row["data_quality"]) if not _is_missing(row.get("data_quality")) else 1.0
        raw_components = component_scores(residuals, self.cfg, dq, missing)
        components = self._smooth_components(raw_components)
        raw_index = overall_health_index(components, self.cfg, ml)
        index = self._smooth_index(raw_index)
        ok, flags = validate_record(row, norm, self.cfg)
        ts = _timestamp(row.get("timestamp"))
        state = TwinState(
            engine_id=str(row.get("engine_id") or f"{self.engine.model_id}-TWIN"),
            model_id=str(row.get("model_id") or self.engine.model_id),
            timestamp=ts,
            mission_phase=str(row.get("mission_phase") or ""),
            mission_id=str(row.get("mission_id") or ""),
            throttle=throttle,
            altitude=altitude,
            ambient_temp=ambient,
            health_index=round(index, 2),
            health_state=health_state_from_index(index, self.cfg),
            residuals=residuals,
            component_health={k: round(v, 2) for k, v in components.items()},
            validity_ok=ok,
            validity_flags=flags,
            ml_fault_class=None if ml is None else ml.fault_class,
            ml_confidence=None if ml is None else ml.confidence,
        )
        self._last = state
        self._n += 1
        if self._n == 1:
            logger.info("Digital Twin started model=%s engine=%s", state.model_id, state.engine_id)
        return state

    def process_dataframe(
        self,
        df: pd.DataFrame,
        ml_results: Sequence[MLResult | dict[str, Any] | None] | None = None,
    ) -> list[TwinState]:
        """Update sequentially over a telemetry frame (time-ordered)."""
        states: list[TwinState] = []
        n = len(df)
        for i, (_, rec) in enumerate(df.iterrows()):
            ml = None
            if ml_results is not None:
                ml = ml_results[i] if i < len(ml_results) else None
            states.append(self.update(rec, ml_result=ml))
        logger.info("Digital Twin processed %s samples health_index=%s", n, states[-1].health_index if states else None)
        return states

    def _smooth_index(self, raw: float) -> float:
        alpha = float(self.cfg.get("ema_alpha", 0.2))
        if self._ema_index is None:
            self._ema_index = raw
        else:
            self._ema_index = alpha * raw + (1.0 - alpha) * self._ema_index
        return self._ema_index

    def _smooth_components(self, raw: dict[str, float]) -> dict[str, float]:
        alpha = float(self.cfg.get("ema_alpha", 0.2))
        out: dict[str, float] = {}
        for key, val in raw.items():
            prev = self._ema_components.get(key)
            smoothed = val if prev is None else alpha * val + (1.0 - alpha) * prev
            self._ema_components[key] = smoothed
            out[key] = smoothed
        return out


def states_to_frame(states: Iterable[TwinState]) -> pd.DataFrame:
    return pd.DataFrame([s.to_flat_dict() for s in states])


def export_twin_states(states: Sequence[TwinState], stem: str, kind: str = "missions") -> tuple[Path, Path]:
    folder = synthetic_data_dir() / kind
    folder.mkdir(parents=True, exist_ok=True)
    df = states_to_frame(states)
    df = df.copy()
    df["timestamp"] = pd.to_datetime(df["timestamp"], utc=True).dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    csv_path = folder / f"{stem}.csv"
    json_path = folder / f"{stem}.json"
    df.to_csv(csv_path, index=False)
    df.to_json(json_path, orient="records", indent=2)
    return csv_path, json_path


def _timestamp(value: Any) -> datetime:
    if isinstance(value, datetime):
        ts = value
    else:
        ts = pd.to_datetime(value, utc=True).to_pydatetime()
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=timezone.utc)
    return ts
