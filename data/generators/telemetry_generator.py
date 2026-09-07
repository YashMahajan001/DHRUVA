"""Synthetic engine telemetry generator."""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Optional, Sequence, Union

import pandas as pd
from numpy.random import default_rng

from data.faults.fault_injector import apply_faults
from data.faults.fault_types import FaultSpec, parse_faults
from data.generators.export import export_csv, export_json
from data.generators.noise import apply_sensor_noise
from data.generators.validation import validate_telemetry_frame
from data.schemas.telemetry_schema import TELEMETRY_COLUMNS
from digital_twin.engines import get_engine_model
from digital_twin.labels import attach_twin_labels
from digital_twin.physics.relationships import compute_healthy_step
from simulation.config_loader import load_named_config
from simulation.exceptions import ConfigError
from simulation.missions.profiles import get_mission_profile, sample_mission
from simulation.paths import synthetic_data_dir

logger = logging.getLogger("dhruva.simulation")

EngineRef = Union[str, Any]
FaultArg = Optional[Sequence[Union[dict[str, Any], FaultSpec]]]


def generate_telemetry(
    engine_model: EngineRef = "O320_CLASS",
    mission_profile: str = "HIGH_ALTITUDE_ISR",
    duration: float = 3600.0,
    sampling_rate: float = 1.0,
    seed: int = 42,
    faults: FaultArg = None,
    engine_id: str | None = None,
    start_timestamp: str | None = None,
    validate: bool = True,
) -> pd.DataFrame:
    """Generate a labelled synthetic telemetry dataframe.

    Parameters
    ----------
    engine_model:
        Model id (``O320_CLASS``, ``ROTAX914_CLASS``, ``AE300_CLASS``) or instance.
    mission_profile:
        Mission id such as ``HIGH_ALTITUDE_ISR``.
    duration:
        Mission length in seconds.
    sampling_rate:
        Samples per second.
    seed:
        NumPy Generator seed for reproducibility.
    faults:
        Optional list of fault dicts / ``FaultSpec``. Default is a healthy mission.
    """
    if duration <= 0:
        raise ConfigError("duration must be positive")
    if sampling_rate <= 0:
        raise ConfigError("sampling_rate must be positive")

    engine = get_engine_model(engine_model) if isinstance(engine_model, str) else engine_model
    mission = get_mission_profile(mission_profile)
    fault_specs = parse_faults(list(faults) if faults else None)
    params = engine.params
    n = int(round(duration * sampling_rate))
    if n < 1:
        raise ConfigError("duration * sampling_rate must yield at least one sample")

    sim_cfg = load_named_config("simulation", "default")
    stamp = start_timestamp or sim_cfg["start_timestamp"]
    t0 = datetime.fromisoformat(stamp.replace("Z", "+00:00")).astimezone(timezone.utc)
    dt = 1.0 / sampling_rate
    rng = default_rng(int(seed))
    eid = engine_id or f"{engine.model_id}-SIM-01"

    logger.info(
        "Starting simulation engine=%s mission=%s duration=%ss rate=%s Hz seed=%s",
        engine.model_id,
        mission.mission_id,
        duration,
        sampling_rate,
        seed,
    )
    if fault_specs:
        logger.info("Fault injection enabled: %s", [f.type for f in fault_specs])
        for spec in fault_specs:
            if spec.type == "SENSOR_DROPOUT":
                logger.warning(
                    "Sensor dropout injected on %s from t=%.1fs for %.1fs",
                    spec.affected_sensor or "oil_pressure",
                    spec.start,
                    spec.duration,
                )

    first = sample_mission(mission, 0.0, duration)
    rpm = params.idle_rpm
    oil_temp = first.sea_level_temp_c + 35.0
    rows: list[dict[str, Any]] = []

    for i in range(n):
        t = i * dt
        cmd = sample_mission(mission, t, duration)
        healthy = compute_healthy_step(
            altitude_m=cmd.altitude_m,
            throttle=cmd.throttle,
            sea_level_temp_c=cmd.sea_level_temp_c,
            rpm_prev=rpm,
            oil_temp_prev=oil_temp,
            params=params,
        )
        rpm, oil_temp = healthy.rpm, healthy.oil_temp
        noisy = apply_sensor_noise(healthy, params.noise, rng)
        sample = {
            "timestamp": t0 + timedelta(seconds=t),
            "engine_id": eid,
            "model_id": engine.model_id,
            "mission_id": mission.mission_id,
            "altitude": noisy.altitude,
            "ambient_temp": noisy.ambient_temp,
            "rpm": noisy.rpm,
            "throttle": noisy.throttle,
            "cht": noisy.cht,
            "egt": noisy.egt,
            "oil_pressure": noisy.oil_pressure,
            "oil_temp": noisy.oil_temp,
            "fuel_flow": noisy.fuel_flow,
            "vibration_rms": noisy.vibration_rms,
            "battery_voltage": noisy.battery_voltage,
            "alternator_current": noisy.alternator_current,
            "injection_timing": noisy.injection_timing,
            "manifold_pressure": noisy.manifold_pressure,
            "coolant_temp": noisy.coolant_temp,
            "fuel_pressure": noisy.fuel_pressure,
            "knock_index": noisy.knock_index,
            "harmonic_freq": noisy.harmonic_freq,
            "vibration_kurtosis": noisy.vibration_kurtosis,
            "vibration_peak_hz": noisy.vibration_peak_hz,
            "compression_ratio": noisy.compression_ratio,
            "valve_clearance": noisy.valve_clearance,
            "radiator_airflow": noisy.radiator_airflow,
            "coolant_delta": noisy.coolant_delta,
            "cht_cyl_1": noisy.cht_cyl_1,
            "cht_cyl_2": noisy.cht_cyl_2,
            "cht_cyl_3": noisy.cht_cyl_3,
            "cht_cyl_4": noisy.cht_cyl_4,
            "egt_cyl_1": noisy.egt_cyl_1,
            "egt_cyl_2": noisy.egt_cyl_2,
            "egt_cyl_3": noisy.egt_cyl_3,
            "egt_cyl_4": noisy.egt_cyl_4,
            "cyl_pressure_1": noisy.cyl_pressure_1,
            "cyl_pressure_2": noisy.cyl_pressure_2,
            "cyl_pressure_3": noisy.cyl_pressure_3,
            "cyl_pressure_4": noisy.cyl_pressure_4,
            "mission_phase": cmd.phase,
            "fault_label": "HEALTHY",
            "fault_active": False,
            "fault_severity": 0.0,
            "data_quality": 1.0,
            "sensor_status": "OK",
            "simulation_seed": int(seed),
            "_load": healthy.load,
        }
        sample = apply_faults(sample, t, fault_specs, rng)
        sample.pop("_load", None)
        rows.append(sample)

    sensor_cols = [c for c in TELEMETRY_COLUMNS if c in rows[0]]
    df = pd.DataFrame(rows, columns=sensor_cols)
    df = attach_twin_labels(df)
    df = df.loc[:, TELEMETRY_COLUMNS]
    if validate:
        validate_telemetry_frame(df)
    logger.info("Simulation completed samples=%s", len(df))
    return df


def write_dataset(df: pd.DataFrame, stem: str, kind: str = "healthy") -> tuple[Any, Any]:
    """Write CSV+JSON under data/synthetic/<kind>/."""
    folder = synthetic_data_dir() / kind
    csv_path = export_csv(df, folder / f"{stem}.csv")
    json_path = export_json(df, folder / f"{stem}.json")
    return csv_path, json_path
