"""Aero Turbojet Engine Physics Simulation Model.

Implements single-spool axial turbojet dynamics:
- Spool speed N (%)
- Exhaust gas temperature (EGT °C)
- Core jet velocity and net thrust (kN)
- Afterburning reheat stage dynamics (for military turbojets like GE J85)
- Nozzle pressure ratio and lubrication
"""

from __future__ import annotations

import math
from typing import Optional, Dict, Any
from aero_engine.catalog.models import AeroEngineCatalogEntry


class AeroTurbojetModel:
    """Physics-based simulation core for single-spool turbojet engines."""

    def __init__(self, engine: AeroEngineCatalogEntry) -> None:
        self.engine = engine
        self.specs = engine.specifications
        self.limits = engine.operating_limits

        # State variables
        self.spool_n_pct = 48.0  # Ground idle rotor speed
        self.egt_c = 380.0
        self.oil_temp_c = 55.0
        self.oil_press_psi = 32.0
        self.vibration_mils = 0.28
        self.time_s = 0.0

    def reset(self, initial_n: Optional[float] = None) -> None:
        """Reset state to ground idle."""
        self.spool_n_pct = initial_n if initial_n is not None else 48.0
        self.egt_c = 380.0
        self.oil_temp_c = 55.0
        self.oil_press_psi = 32.0
        self.vibration_mils = 0.28
        self.time_s = 0.0

    def step(
        self,
        throttle: float,
        afterburner_enabled: bool = False,
        ambient_temp_c: float = 15.0,
        altitude_m: float = 0.0,
        mach: float = 0.0,
        dt_s: float = 0.05,
        faults: Optional[Dict[str, float]] = None,
    ) -> Dict[str, Any]:
        """Integrate turbojet state over dt_s."""
        self.time_s += dt_s
        faults = faults or {}

        # 1. Atmospheric Lapse
        p_ratio = math.pow(max(0.01, 1.0 - 2.25577e-5 * altitude_m), 5.25588)
        t_amb_k = ambient_temp_c + 273.15
        theta = t_amb_k / 288.15
        delta = p_ratio

        # 2. Spool Speed N (%)
        idle_n = 48.0
        max_n = float(self.limits.max_n1_pct or 100.0)
        target_n = idle_n + throttle * (max_n - idle_n)

        tau_n = 1.15
        self.spool_n_pct += (target_n - self.spool_n_pct) * (1.0 - math.exp(-dt_s / tau_n))

        # 3. Fuel Mass Flow (kg/h)
        rated_dry_thrust_kn = float(self.specs.continuous_thrust_kn or 15.0)
        # Base fuel flow ~ 0.95 lb/(lbf*h) TSFC dry
        fuel_flow_kgh = 300.0 + math.pow(self.spool_n_pct / 100.0, 3.4) * (rated_dry_thrust_kn * 65.0) * delta

        # Reheat / Afterburner engagement (only at high throttle > 90%)
        is_reheat = afterburner_enabled and (throttle >= 0.90) and (self.spool_n_pct >= 95.0)
        if is_reheat:
            fuel_flow_kgh *= 2.35  # Extreme fuel burn in afterburner

        # 4. Exhaust Gas Temperature (EGT)
        idle_egt = 380.0
        target_egt = idle_egt + (self.spool_n_pct - idle_n) * 6.8
        if is_reheat:
            target_egt += 60.0  # Measured before reheat flameholder, but backpressure causes slight rise

        if "FAULT_TURBINE_CREEP" in faults:
            target_egt += faults["FAULT_TURBINE_CREEP"] * 65.0
        if "FAULT_SENSOR_DRIFT" in faults:
            target_egt += faults["FAULT_SENSOR_DRIFT"] * 50.0

        tau_egt = 1.0
        self.egt_c += (target_egt - self.egt_c) * (1.0 - math.exp(-dt_s / tau_egt))

        # 5. Thrust Calculation
        dry_thrust_ratio = math.pow(max(0.0, (self.spool_n_pct - idle_n) / (max_n - idle_n)), 2.6)
        calc_thrust_kn = rated_dry_thrust_kn * dry_thrust_ratio * delta

        if is_reheat:
            max_ab_thrust = float(self.specs.rated_takeoff_thrust_kn or 22.2)
            calc_thrust_kn = max_ab_thrust * delta

        thrust_lbf = calc_thrust_kn * 224.809

        # 6. Nozzle pressure ratio
        npr = 1.0 + 1.8 * math.pow(self.spool_n_pct / 100.0, 2.2)

        # 7. Lubrication & Vibration
        target_oil_press = 22.0 + (self.spool_n_pct / 100.0) * 25.0
        if "FAULT_OIL_LOSS" in faults:
            target_oil_press *= max(0.05, 1.0 - faults["FAULT_OIL_LOSS"] * 0.85)
        self.oil_press_psi += (target_oil_press - self.oil_press_psi) * (1.0 - math.exp(-dt_s / 0.4))

        target_oil_temp = ambient_temp_c + 50.0 + (self.spool_n_pct / 100.0) * 40.0
        if "FAULT_OIL_LOSS" in faults:
            target_oil_temp += faults["FAULT_OIL_LOSS"] * 45.0
        self.oil_temp_c += (target_oil_temp - self.oil_temp_c) * (1.0 - math.exp(-dt_s / 9.0))

        self.vibration_mils = round(0.20 + 0.35 * math.pow(self.spool_n_pct / 100.0, 2), 2)

        return {
            "spool_n_pct": round(self.spool_n_pct, 1),
            "egt_c": round(self.egt_c, 1),
            "thrust_kn": round(calc_thrust_kn, 1),
            "thrust_lbf": round(thrust_lbf, 0),
            "fuel_flow_kgh": round(fuel_flow_kgh, 1),
            "nozzle_press_ratio": round(npr, 2),
            "oil_press_psi": round(self.oil_press_psi, 1),
            "oil_temp_c": round(self.oil_temp_c, 1),
            "vibration_mils": self.vibration_mils,
        }
