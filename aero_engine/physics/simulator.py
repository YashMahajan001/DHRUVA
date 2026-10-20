"""Unified Aero Engine Simulation Service for Dhruva Aero.

Orchestrates category-specific physics models, manages environmental states,
enforces operational constraints, applies injected faults, and packages
verifiable telemetry frames with strict provenance tracking.
"""

from __future__ import annotations

import datetime
from typing import Optional, Dict, Any, List
from aero_engine.catalog.models import AeroCategory, AeroEngineCatalogEntry
from aero_engine.physics.piston_model import AeroPistonModel
from aero_engine.physics.turbofan_model import AeroTurbofanModel
from aero_engine.physics.turboprop_model import AeroTurbopropModel
from aero_engine.physics.turbojet_model import AeroTurbojetModel
from aero_engine.telemetry.schema import (
    AeroTelemetryRecord,
    TelemetrySignal,
    TelemetryProvenance,
)


class AeroEngineSimulator:
    """Multi-category aircraft engine digital twin simulation service."""

    def __init__(self, engine: AeroEngineCatalogEntry) -> None:
        self.engine = engine
        self.category = engine.category
        self.session_time_s = 0.0
        self.operating_state = "CRUISE"

        # Instantiate category-specific physics core
        if self.category == AeroCategory.PISTON:
            self._core = AeroPistonModel(engine)
        elif self.category == AeroCategory.TURBOPROP:
            self._core = AeroTurbopropModel(engine)
        elif self.category == AeroCategory.TURBOFAN:
            self._core = AeroTurbofanModel(engine)
        elif self.category == AeroCategory.TURBOJET:
            self._core = AeroTurbojetModel(engine)
        else:
            raise ValueError(f"Unsupported Aero Category: {self.category}")

    def reset(self, initial_value: Optional[float] = None) -> None:
        """Reset simulation clock and physical core."""
        self.session_time_s = 0.0
        self._core.reset(initial_value)

    def step(
        self,
        throttle: float,
        ambient_temp_c: float = 15.0,
        altitude_m: float = 0.0,
        mach: float = 0.0,
        operating_state: str = "CRUISE",
        dt_s: float = 0.05,
        faults: Optional[Dict[str, float]] = None,
    ) -> AeroTelemetryRecord:
        """Advance simulation by dt_s and return a typed, verified telemetry frame."""
        self.session_time_s += dt_s
        self.operating_state = operating_state
        faults = faults or {}

        # 1. Run category physics core
        if self.category == AeroCategory.PISTON:
            raw = self._core.step(
                throttle=throttle,
                ambient_temp_c=ambient_temp_c,
                altitude_m=altitude_m,
                dt_s=dt_s,
                faults=faults,
            )
        elif self.category == AeroCategory.TURBOPROP:
            raw = self._core.step(
                throttle=throttle,
                ambient_temp_c=ambient_temp_c,
                altitude_m=altitude_m,
                dt_s=dt_s,
                faults=faults,
            )
        elif self.category == AeroCategory.TURBOFAN:
            raw = self._core.step(
                throttle=throttle,
                ambient_temp_c=ambient_temp_c,
                altitude_m=altitude_m,
                mach=mach,
                dt_s=dt_s,
                faults=faults,
            )
        elif self.category == AeroCategory.TURBOJET:
            raw = self._core.step(
                throttle=throttle,
                ambient_temp_c=ambient_temp_c,
                altitude_m=altitude_m,
                mach=mach,
                dt_s=dt_s,
                faults=faults,
            )

        # 2. Package into AeroTelemetryRecord
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        
        # Calculate ambient pressure in kPa
        p_ratio = (1.0 - 2.25577e-5 * altitude_m) ** 5.25588 if altitude_m < 20000 else 0.05
        amb_kpa = 101.325 * max(0.01, p_ratio)

        record = AeroTelemetryRecord(
            engine_id=self.engine.engine_id,
            category=self.category,
            timestamp=now_iso,
            session_time_s=round(self.session_time_s, 2),
            data_source=TelemetryProvenance.SIMULATED,
            operating_state=operating_state,
            ambient_temp_c=ambient_temp_c,
            ambient_press_kpa=round(amb_kpa, 2),
            altitude_m=altitude_m,
            mach=mach,
            oil_press_psi=raw.get("oil_press_psi"),
            oil_temp_c=raw.get("oil_temp_c"),
            vibration_ips=raw.get("vibration_ips"),
            vibration_mils=raw.get("vibration_mils"),
        )

        # Map category specific fields
        if self.category == AeroCategory.PISTON:
            record.rpm = raw.get("rpm")
            record.map_inhg = raw.get("map_inhg")
            record.cht_c = raw.get("cht_c")
            record.egt_c = raw.get("egt_c")
            record.power_bhp = raw.get("power_bhp")
            record.fuel_flow_gph = raw.get("fuel_flow_gph")
            record.fuel_press_psi = raw.get("fuel_press_psi")
        elif self.category == AeroCategory.TURBOPROP:
            record.ng_pct = raw.get("ng_pct")
            record.np_rpm = raw.get("np_rpm")
            record.itt_c = raw.get("itt_c")
            record.torque_ft_lb = raw.get("torque_ft_lb")
            record.shp = raw.get("shp")
            record.fuel_flow_kgh = raw.get("fuel_flow_kgh")
        elif self.category == AeroCategory.TURBOFAN:
            record.n1_pct = raw.get("n1_pct")
            record.n2_pct = raw.get("n2_pct")
            record.turbine_egt_c = raw.get("egt_c")
            record.thrust_kn = raw.get("thrust_kn")
            record.thrust_lbf = raw.get("thrust_lbf")
            record.fuel_flow_kgh = raw.get("fuel_flow_kgh")
            record.epr = raw.get("epr")
            record.bypass_ratio_calc = raw.get("bypass_ratio")
        elif self.category == AeroCategory.TURBOJET:
            record.spool_n_pct = raw.get("spool_n_pct")
            record.turbine_egt_c = raw.get("egt_c")
            record.thrust_kn = raw.get("thrust_kn")
            record.thrust_lbf = raw.get("thrust_lbf")
            record.fuel_flow_kgh = raw.get("fuel_flow_kgh")
            record.nozzle_press_ratio = raw.get("nozzle_press_ratio")

        # 3. Build rich signals map with units & provenance
        signals: Dict[str, TelemetrySignal] = {}
        for key, val in raw.items():
            unit = self._resolve_unit(key)
            name = key.replace("_", " ").upper()
            status = self._evaluate_signal_status(key, val)
            signals[key] = TelemetrySignal(
                signal_id=key,
                display_name=name,
                value=val,
                unit=unit,
                provenance=TelemetryProvenance.SIMULATED,
                status=status,
            )
        record.signals = signals

        return record

    def _resolve_unit(self, key: str) -> str:
        units_map = {
            "rpm": "RPM",
            "map_inhg": "inHg",
            "cht_c": "°C",
            "egt_c": "°C",
            "power_bhp": "BHP",
            "fuel_flow_gph": "GPH",
            "fuel_press_psi": "PSI",
            "oil_press_psi": "PSI",
            "oil_temp_c": "°C",
            "vibration_ips": "in/s",
            "vibration_mils": "mils pk-pk",
            "ng_pct": "%",
            "np_rpm": "RPM",
            "itt_c": "°C",
            "torque_ft_lb": "ft-lb",
            "shp": "SHP",
            "fuel_flow_kgh": "kg/h",
            "n1_pct": "%",
            "n2_pct": "%",
            "spool_n_pct": "%",
            "thrust_kn": "kN",
            "thrust_lbf": "lbf",
            "epr": "ratio",
            "bypass_ratio": "ratio",
            "nozzle_press_ratio": "ratio",
        }
        return units_map.get(key, "")

    def _evaluate_signal_status(self, key: str, val: Optional[float]) -> str:
        if val is None:
            return "UNAVAILABLE"
        limits = self.engine.operating_limits
        if key == "cht_c" and limits.max_cht_c and val > limits.max_cht_c:
            return "WARNING"
        if key == "egt_c" and limits.max_egt_c and val > limits.max_egt_c:
            return "WARNING"
        if key == "itt_c" and limits.max_itt_c and val > limits.max_itt_c:
            return "WARNING"
        if key == "oil_press_psi":
            if limits.min_oil_press_psi and val < limits.min_oil_press_psi:
                return "WARNING"
            if limits.max_oil_press_psi and val > limits.max_oil_press_psi:
                return "CAUTION"
        if key == "oil_temp_c" and limits.max_oil_temp_c and val > limits.max_oil_temp_c:
            return "WARNING"
        if key == "vibration_ips" and limits.max_vibration_ips and val > limits.max_vibration_ips:
            return "WARNING"
        return "NORMAL"
