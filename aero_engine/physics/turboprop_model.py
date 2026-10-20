"""Aero Turboprop Engine Physics Simulation Model.

Implements free-turbine and fixed-shaft turboprop dynamics:
- Gas generator speed (Ng %)
- Propeller governor speed (Np RPM)
- Inter-turbine temperature (ITT °C)
- Shaft torque (ft-lb) and Shaft Horsepower (SHP)
- Reduction gearbox load and lubrication
"""

from __future__ import annotations

import math
from typing import Optional, Dict, Any
from aero_engine.catalog.models import AeroEngineCatalogEntry


class AeroTurbopropModel:
    """Physics-based simulation core for turboprop propulsion systems."""

    def __init__(self, engine: AeroEngineCatalogEntry) -> None:
        self.engine = engine
        self.specs = engine.specifications
        self.limits = engine.operating_limits

        # State variables
        self.ng_pct = float(self.limits.idle_ng_pct or 64.0)
        self.np_rpm = 1000.0  # Ground idle prop RPM
        self.itt_c = 480.0
        self.torque_ft_lb = 350.0
        self.oil_temp_c = 60.0
        self.oil_press_psi = 75.0
        self.vibration_ips = 0.15
        self.time_s = 0.0

    def reset(self, initial_ng: Optional[float] = None) -> None:
        """Reset engine state to ground idle."""
        self.ng_pct = initial_ng if initial_ng is not None else float(self.limits.idle_ng_pct or 64.0)
        self.np_rpm = 1000.0
        self.itt_c = 480.0
        self.torque_ft_lb = 350.0
        self.oil_temp_c = 60.0
        self.oil_press_psi = 75.0
        self.vibration_ips = 0.15
        self.time_s = 0.0

    def step(
        self,
        throttle: float,
        prop_lever: float = 1.0,  # 1.0 = Max RPM (takeoff/climb), 0.85 = cruise prop RPM
        ambient_temp_c: float = 15.0,
        altitude_m: float = 0.0,
        dt_s: float = 0.05,
        faults: Optional[Dict[str, float]] = None,
    ) -> Dict[str, Any]:
        """Integrate turboprop thermodynamic state over dt_s."""
        self.time_s += dt_s
        faults = faults or {}

        # 1. Atmospheric Lapse
        p_ratio = math.pow(max(0.01, 1.0 - 2.25577e-5 * altitude_m), 5.25588)
        t_amb_k = ambient_temp_c + 273.15
        theta = t_amb_k / 288.15
        delta = p_ratio

        # 2. Gas Generator Speed (Ng)
        idle_ng = float(self.limits.idle_ng_pct or 64.0)
        max_ng = float(self.limits.max_ng_pct or 104.0)
        target_ng = idle_ng + throttle * (max_ng - idle_ng)

        # Ng spool acceleration dynamics
        tau_ng = 1.1
        self.ng_pct += (target_ng - self.ng_pct) * (1.0 - math.exp(-dt_s / tau_ng))

        # 3. Propeller Governor Speed (Np)
        # Constant-speed propeller governor maintains commanded RPM by varying blade pitch
        max_np = float(self.limits.max_np_rpm or 1700.0)
        idle_np = 1050.0
        # Propeller governor maintains commanded Np once Ng provides sufficient power
        target_np = idle_np + min(1.0, throttle * 1.5) * (prop_lever * max_np - idle_np)
        tau_np = 0.85
        self.np_rpm += (target_np - self.np_rpm) * (1.0 - math.exp(-dt_s / tau_np))

        # 4. Shaft Horsepower & Torque
        rated_shp = float(self.specs.rated_takeoff_power_shp or 1200.0)
        # Gas turbine power: flat-rated free turbine maintains power through compressor reserve
        power_ratio = math.pow(max(0.0, self.ng_pct / max_ng), 3.0)
        calc_shp = max(50.0, rated_shp * power_ratio * max(0.70, math.sqrt(delta)))

        if "FAULT_COMPRESSOR_FOULING" in faults:
            calc_shp *= (1.0 - 0.12 * faults["FAULT_COMPRESSOR_FOULING"])

        # Torque = (5252 * SHP) / Np
        calc_torque_ft_lb = (5252.0 * calc_shp) / max(500.0, self.np_rpm)
        max_torque = float(self.limits.max_torque_ft_lb or 3690.0)

        # 5. Inter-Turbine Temperature (ITT)
        # Peaks during high torque demand or low ambient density
        idle_itt = 480.0
        target_itt = idle_itt + (self.ng_pct - idle_ng) * 8.2 + (calc_torque_ft_lb / max_torque) * 120.0

        if "FAULT_TURBINE_CREEP" in faults:
            target_itt += faults["FAULT_TURBINE_CREEP"] * 68.0
        if "FAULT_NOZZLE_CLOG" in faults:
            target_itt += faults["FAULT_NOZZLE_CLOG"] * 50.0
        if "FAULT_SENSOR_DRIFT" in faults:
            target_itt += faults["FAULT_SENSOR_DRIFT"] * 55.0

        tau_itt = 1.3
        self.itt_c += (target_itt - self.itt_c) * (1.0 - math.exp(-dt_s / tau_itt))

        # 6. Fuel Flow (kg/h)
        # Typical turboprop SFC ~ 0.54 lb/(shp*h), 1 lb = 0.453592 kg
        sfc_kg_per_shp_h = 0.245
        fuel_flow_kgh = max(45.0, calc_shp * sfc_kg_per_shp_h * math.sqrt(theta))

        # 7. Lubrication & Gearbox Dynamics
        target_oil_press = 65.0 + (self.ng_pct / 100.0) * 35.0
        if "FAULT_OIL_LOSS" in faults:
            target_oil_press *= max(0.05, 1.0 - faults["FAULT_OIL_LOSS"] * 0.85)
        self.oil_press_psi += (target_oil_press - self.oil_press_psi) * (1.0 - math.exp(-dt_s / 0.4))

        target_oil_temp = ambient_temp_c + 45.0 + (calc_shp / rated_shp) * 40.0
        if "FAULT_OIL_LOSS" in faults:
            target_oil_temp += faults["FAULT_OIL_LOSS"] * 40.0
        self.oil_temp_c += (target_oil_temp - self.oil_temp_c) * (1.0 - math.exp(-dt_s / 8.0))

        # Propeller / reduction gearbox vibration
        base_vib = 0.12 + 0.18 * (calc_torque_ft_lb / max_torque)
        self.vibration_ips = round(base_vib, 2)

        return {
            "ng_pct": round(self.ng_pct, 1),
            "np_rpm": round(self.np_rpm, 0),
            "itt_c": round(self.itt_c, 1),
            "torque_ft_lb": round(calc_torque_ft_lb, 1),
            "shp": round(calc_shp, 1),
            "fuel_flow_kgh": round(fuel_flow_kgh, 1),
            "oil_press_psi": round(self.oil_press_psi, 1),
            "oil_temp_c": round(self.oil_temp_c, 1),
            "vibration_ips": self.vibration_ips,
        }
