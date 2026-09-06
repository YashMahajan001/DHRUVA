"""Apply component-specific fault effects to healthy telemetry."""

from __future__ import annotations

import math
from typing import Any

import numpy as np
from numpy.random import Generator

from data.faults.fault_types import FaultSpec


def _envelope(t: float, spec: FaultSpec) -> float:
    """Return 0..severity based on onset and progression.

    Sensor dropout is active only inside ``[start, start+duration]``.
    Other faults persist at full severity after the duration window.
    """
    if t < spec.start:
        return 0.0
    elapsed = t - spec.start
    if spec.type == "SENSOR_DROPOUT":
        return spec.severity if elapsed <= spec.duration else 0.0
    if spec.progression == "sudden":
        return spec.severity
    if elapsed >= spec.duration:
        return spec.severity
    return spec.severity * (elapsed / spec.duration)


def apply_faults(
    sample: dict[str, Any],
    t: float,
    faults: list[FaultSpec],
    rng: Generator,
) -> dict[str, Any]:
    """Mutate a telemetry dict. Unrelated channels are left unchanged except labels."""
    row = dict(sample)
    active: list[tuple[FaultSpec, float]] = []
    for spec in faults:
        env = _envelope(t, spec)
        if env <= 0.0:
            continue
        active.append((spec, env))
        row = _apply_one(row, spec, env, t, rng)

    if not active:
        row["fault_label"] = "HEALTHY"
        row["fault_active"] = False
        row["fault_severity"] = 0.0
        row["sensor_status"] = row.get("sensor_status", "OK")
        return row

    labels = [spec.type for spec, _ in active]
    row["fault_label"] = "+".join(labels)
    row["fault_active"] = True
    row["fault_severity"] = max(env for _, env in active)
    return row


def _apply_one(row: dict[str, Any], spec: FaultSpec, env: float, t: float, rng: Generator) -> dict[str, Any]:
    kind = spec.type
    load = float(row.get("_load", 0.6))

    if kind == "INJECTOR_DEGRADATION":
        row["fuel_flow"] = max(row["fuel_flow"] * (1.0 - 0.35 * env), 0.0)
        row["egt"] = row["egt"] + 40.0 * env
        row["rpm"] = max(row["rpm"] * (1.0 - 0.04 * env), 0.0)
    elif kind == "COMBUSTION_DISTURBANCE":
        jitter = float(rng.normal(0.0, 18.0 * env))
        row["egt"] = row["egt"] + 25.0 * env + jitter
        row["rpm"] = max(row["rpm"] + float(rng.normal(0.0, 40.0 * env)), 0.0)
        row["vibration_rms"] = row["vibration_rms"] + 0.25 * env
        row["fuel_flow"] = max(row["fuel_flow"] * (1.0 + 0.08 * env), 0.0)
    elif kind == "COOLING_DEGRADATION":
        thermal = env * (0.55 + 0.75 * load)
        row["cht"] = row["cht"] + 55.0 * thermal
        row["egt"] = row["egt"] + 30.0 * thermal
        row["oil_temp"] = row["oil_temp"] + 18.0 * thermal
    elif kind == "LUBRICATION_PRESSURE_LOSS":
        row["oil_pressure"] = max(row["oil_pressure"] * (1.0 - 0.55 * env), 0.0)
        row["oil_temp"] = row["oil_temp"] + 12.0 * env
    elif kind == "OVERHEATING":
        row["cht"] = row["cht"] + 70.0 * env
        row["egt"] = row["egt"] + 50.0 * env
        row["oil_temp"] = row["oil_temp"] + 25.0 * env
    elif kind == "ABNORMAL_VIBRATION":
        osc = 0.15 * env * math.sin(2.0 * math.pi * 0.35 * t)
        row["vibration_rms"] = max(row["vibration_rms"] * (1.0 + 2.2 * env) + osc + 0.4 * env, 0.0)
    elif kind == "ALTERNATOR_DEGRADATION":
        row["alternator_current"] = max(row["alternator_current"] * (1.0 - 0.5 * env), 0.0)
        row["battery_voltage"] = max(row["battery_voltage"] * (1.0 - 0.12 * env), 0.0)
    elif kind == "BATTERY_DEGRADATION":
        row["battery_voltage"] = max(row["battery_voltage"] * (1.0 - 0.22 * env), 0.0)
    elif kind == "SENSOR_BIAS":
        channel = spec.affected_sensor or "cht"
        row[channel] = row[channel] + _bias_amount(channel, env)
        row["sensor_status"] = f"BIAS:{channel}"
    elif kind == "SENSOR_DRIFT":
        channel = spec.affected_sensor or "cht"
        row[channel] = row[channel] + _bias_amount(channel, env)
        row["sensor_status"] = f"DRIFT:{channel}"
    elif kind == "SENSOR_DROPOUT":
        channel = spec.affected_sensor or "oil_pressure"
        row[channel] = np.nan
        row["data_quality"] = 0.0
        row["sensor_status"] = f"DROPOUT:{channel}"
    return row


def _bias_amount(channel: str, env: float) -> float:
    scales = {
        "cht": 25.0,
        "egt": 40.0,
        "oil_pressure": -8.0,
        "oil_temp": 15.0,
        "fuel_flow": 1.2,
        "vibration_rms": 0.2,
        "battery_voltage": 0.8,
        "alternator_current": 2.0,
        "rpm": 80.0,
        "throttle": 0.05,
    }
    return scales.get(channel, 10.0) * env
