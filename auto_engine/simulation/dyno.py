"""Dynamometer test bench simulation module.

Performs deterministic full-throttle (WOT) or part-load dynamometer sweeps
across the engine speed range, calculating power curves, torque curves, and BSFC maps.
"""

from __future__ import annotations

import math
from typing import List, Dict, Any
from pydantic import BaseModel, Field

from auto_engine.catalog.models import EngineCatalogEntry
from auto_engine.simulation.simulator import (
    DeterministicEngineSimulator,
    SimulationInput,
    SimulationOutput,
)


class DynoPoint(BaseModel):
    """Single steady-state dynamometer test point."""
    rpm: float
    brake_torque_nm: float
    brake_power_kw: float
    brake_power_hp: float
    fuel_flow_lph: float
    bsfc_g_kwh: float
    boost_pressure_bar: float
    manifold_pressure_kpa: float
    volumetric_efficiency: float
    oil_pressure_bar: float
    egt_c: float


class DynoSweepResult(BaseModel):
    """Complete dynamometer sweep dataset and performance metrics."""
    engine_id: str
    engine_name: str
    tested_throttle: float
    points: List[DynoPoint]
    peak_torque_measured_nm: float
    peak_torque_rpm: float
    peak_power_measured_kw: float
    peak_power_rpm: float
    min_bsfc_g_kwh: float
    catalog_rated_power_kw: float
    catalog_peak_torque_nm: float
    power_accuracy_percent: float
    torque_accuracy_percent: float


def run_dyno_sweep(
    engine: EngineCatalogEntry,
    throttle: float = 1.0,
    rpm_step: float = 250.0,
    ambient_temp_c: float = 25.0,
    altitude_m: float = 0.0,
) -> DynoSweepResult:
    """Execute a steady-state dynamometer test sweep from idle to redline.

    Args:
        engine: Engine catalog specification entry
        throttle: Target throttle opening (1.0 for full-throttle WOT power curve)
        rpm_step: Step size between test speeds [RPM]
        ambient_temp_c: Test cell ambient air temperature [deg C]
        altitude_m: Test cell elevation above sea level [m]

    Returns:
        DynoSweepResult with complete torque/power curves and catalog comparisons
    """
    if rpm_step < 10.0 or math.isnan(rpm_step) or math.isinf(rpm_step):
        raise ValueError("rpm_step must be at least 10.0 RPM to prevent unbounded loop execution.")

    idle = float(engine.operating_limits.idle_rpm)
    redline = float(engine.operating_limits.redline_rpm)

    sim = DeterministicEngineSimulator(engine)
    points: List[DynoPoint] = []

    current_rpm = idle
    while current_rpm <= redline:
        # Reset state directly at target RPM with warm operating temperature (90 deg C)
        sim.reset(initial_rpm=current_rpm, initial_temp_c=90.0)

        # Warm up at this RPM for 15 steps (dt = 0.05s) to let boost stabilize
        last_out: SimulationOutput | None = None
        for _ in range(15):
            inp = SimulationInput(
                throttle=throttle,
                load_torque_nm=0.0,  # Speed is held constant by virtual dyno brake
                ambient_temp_c=ambient_temp_c,
                altitude_m=altitude_m,
                dt_s=0.05,
            )
            # Re-enforce dyno speed hold
            sim.state.rpm = current_rpm
            last_out = sim.step(inp)

        if last_out:
            points.append(
                DynoPoint(
                    rpm=current_rpm,
                    brake_torque_nm=last_out.brake_torque_nm,
                    brake_power_kw=last_out.brake_power_kw,
                    brake_power_hp=last_out.brake_power_hp,
                    fuel_flow_lph=last_out.fuel_flow_lph,
                    bsfc_g_kwh=last_out.bsfc_g_kwh,
                    boost_pressure_bar=last_out.boost_pressure_bar,
                    manifold_pressure_kpa=last_out.manifold_pressure_kpa,
                    volumetric_efficiency=last_out.volumetric_efficiency,
                    oil_pressure_bar=last_out.oil_pressure_bar,
                    egt_c=last_out.egt_c,
                )
            )

        current_rpm += rpm_step

    # Find peak torque and peak power
    peak_torque_pt = max(points, key=lambda p: p.brake_torque_nm)
    peak_power_pt = max(points, key=lambda p: p.brake_power_kw)
    valid_bsfc_pts = [p for p in points if p.bsfc_g_kwh > 100.0]
    min_bsfc = min((p.bsfc_g_kwh for p in valid_bsfc_pts), default=0.0)

    # Compute correlation with manufacturer rated specs
    cat_power = engine.specifications.rated_power_kw
    cat_torque = engine.specifications.peak_torque_nm

    p_acc = (1.0 - abs(peak_power_pt.brake_power_kw - cat_power) / cat_power) * 100.0 if cat_power > 0 else 0.0
    t_acc = (1.0 - abs(peak_torque_pt.brake_torque_nm - cat_torque) / cat_torque) * 100.0 if cat_torque > 0 else 0.0

    return DynoSweepResult(
        engine_id=engine.engine_id,
        engine_name=engine.name,
        tested_throttle=throttle,
        points=points,
        peak_torque_measured_nm=round(peak_torque_pt.brake_torque_nm, 2),
        peak_torque_rpm=peak_torque_pt.rpm,
        peak_power_measured_kw=round(peak_power_pt.brake_power_kw, 2),
        peak_power_rpm=peak_power_pt.rpm,
        min_bsfc_g_kwh=round(min_bsfc, 1),
        catalog_rated_power_kw=cat_power,
        catalog_peak_torque_nm=cat_torque,
        power_accuracy_percent=round(max(0.0, p_acc), 2),
        torque_accuracy_percent=round(max(0.0, t_acc), 2),
    )
