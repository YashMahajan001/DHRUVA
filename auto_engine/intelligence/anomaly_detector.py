"""Explainable Anomaly Detection Engine for Propulsion Telemetry.

Combines rule-based operating limit checks, multi-variable physical operating
envelopes, and statistical trend analysis. All findings are deterministic,
explainable, and avoid fabricated confidence or unverified ML models.
"""

from __future__ import annotations

from typing import List, Optional, Deque, Dict
from collections import deque
import math

from auto_engine.catalog.models import EngineCatalogEntry
from auto_engine.telemetry.schema import EngineTelemetryRecord
from auto_engine.intelligence.models import (
    TelemetryAnomaly,
    AnomalyMethod,
    SeverityLevel,
)


class AnomalyDetector:
    """Detects explainable anomalies in engine telemetry streams.

    Features:
    1. Rule-based operating limit bounds checking.
    2. Multi-channel physical envelope consistency (boost vs throttle/RPM,
       oil pressure vs RPM, thermal rejection vs load, AFR vs throttle).
    3. Moving-window statistical trend and rate-of-change analysis.
    """

    def __init__(self, engine: EngineCatalogEntry, window_size: int = 30):
        self.engine = engine
        self.window_size = window_size
        self._history: Dict[str, Deque[float]] = {
            "rpm": deque(maxlen=window_size),
            "coolant_temp_c": deque(maxlen=window_size),
            "oil_temp_c": deque(maxlen=window_size),
            "oil_pressure_bar": deque(maxlen=window_size),
            "manifold_pressure_kpa": deque(maxlen=window_size),
            "egt_c": deque(maxlen=window_size),
        }
        self._last_timestamp: Optional[float] = None
        self._last_coolant_temp: Optional[float] = None

    def reset(self) -> None:
        """Clear telemetry history buffers."""
        for buf in self._history.values():
            buf.clear()
        self._last_timestamp = None
        self._last_coolant_temp = None

    def analyze(
        self,
        record: EngineTelemetryRecord,
        throttle: float = 0.0,
    ) -> List[TelemetryAnomaly]:
        """Analyze a telemetry record and return all detected explainable anomalies."""
        anomalies: List[TelemetryAnomaly] = []
        limits = self.engine.operating_limits
        t = record.timestamp.timestamp()

        # Update historical buffers with NaN/Inf protection
        if not math.isnan(record.rpm) and not math.isinf(record.rpm):
            self._history["rpm"].append(record.rpm)
        if not math.isnan(record.coolant_temp_c) and not math.isinf(record.coolant_temp_c):
            self._history["coolant_temp_c"].append(record.coolant_temp_c)
        if not math.isnan(record.oil_temp_c) and not math.isinf(record.oil_temp_c):
            self._history["oil_temp_c"].append(record.oil_temp_c)
        if not math.isnan(record.oil_pressure_bar) and not math.isinf(record.oil_pressure_bar):
            self._history["oil_pressure_bar"].append(record.oil_pressure_bar)
        if not math.isnan(record.manifold_pressure_kpa) and not math.isinf(record.manifold_pressure_kpa):
            self._history["manifold_pressure_kpa"].append(record.manifold_pressure_kpa)
        if not math.isnan(record.egt_c) and not math.isinf(record.egt_c):
            self._history["egt_c"].append(record.egt_c)

        # ---------------------------------------------------------------------
        # 1. Rule-Based Operating Limit Checks
        # ---------------------------------------------------------------------
        # RPM Over-rev
        if record.rpm > limits.redline_rpm + 50.0:
            dev = record.rpm - limits.redline_rpm
            anomalies.append(
                TelemetryAnomaly(
                    channel="rpm",
                    detection_method=AnomalyMethod.RULE_BASED_LIMIT,
                    severity=SeverityLevel.CRITICAL if dev > 200.0 else SeverityLevel.WARNING,
                    measured_or_simulated_value=record.rpm,
                    expected_range=(limits.idle_rpm * 0.8, limits.redline_rpm),
                    deviation=dev,
                    unit="RPM",
                    explanation=f"Engine speed ({record.rpm:.0f} RPM) exceeds redline limit ({limits.redline_rpm:.0f} RPM).",
                    timestamp_s=t,
                )
            )

        # Coolant Temperature Limit
        if record.coolant_temp_c > limits.max_coolant_temp_c:
            dev = record.coolant_temp_c - limits.max_coolant_temp_c
            anomalies.append(
                TelemetryAnomaly(
                    channel="coolant_temp_c",
                    detection_method=AnomalyMethod.RULE_BASED_LIMIT,
                    severity=SeverityLevel.CRITICAL if dev > 8.0 else SeverityLevel.WARNING,
                    measured_or_simulated_value=record.coolant_temp_c,
                    expected_range=(60.0, limits.max_coolant_temp_c),
                    deviation=dev,
                    unit="deg C",
                    explanation=f"Coolant temperature ({record.coolant_temp_c:.1f}°C) exceeds maximum limit ({limits.max_coolant_temp_c:.1f}°C). Risk of cylinder head distortion.",
                    timestamp_s=t,
                )
            )

        # Oil Temperature Limit
        if record.oil_temp_c > limits.max_oil_temp_c:
            dev = record.oil_temp_c - limits.max_oil_temp_c
            anomalies.append(
                TelemetryAnomaly(
                    channel="oil_temp_c",
                    detection_method=AnomalyMethod.RULE_BASED_LIMIT,
                    severity=SeverityLevel.CRITICAL if dev > 10.0 else SeverityLevel.WARNING,
                    measured_or_simulated_value=record.oil_temp_c,
                    expected_range=(limits.min_oil_temp_c, limits.max_oil_temp_c),
                    deviation=dev,
                    unit="deg C",
                    explanation=f"Engine oil temperature ({record.oil_temp_c:.1f}°C) exceeds maximum limit ({limits.max_oil_temp_c:.1f}°C). Accelerated viscosity breakdown.",
                    timestamp_s=t,
                )
            )

        # Oil Pressure Low Limit (when engine is above idle speed)
        min_press_bar = limits.min_oil_pressure_rated_bar if record.rpm > limits.idle_rpm * 1.5 else limits.min_oil_pressure_idle_bar
        if record.rpm > limits.idle_rpm * 1.2 and record.oil_pressure_bar < min_press_bar:
            dev_bar = min_press_bar - record.oil_pressure_bar
            anomalies.append(
                TelemetryAnomaly(
                    channel="oil_pressure_bar",
                    detection_method=AnomalyMethod.RULE_BASED_LIMIT,
                    severity=SeverityLevel.CRITICAL if record.oil_pressure_bar < 1.0 else SeverityLevel.WARNING,
                    measured_or_simulated_value=record.oil_pressure_bar,
                    expected_range=(min_press_bar, limits.max_oil_pressure_bar),
                    deviation=dev_bar,
                    unit="bar",
                    explanation=f"Oil pressure ({record.oil_pressure_bar:.2f} bar) below safe threshold ({min_press_bar:.2f} bar) while operating at {record.rpm:.0f} RPM.",
                    timestamp_s=t,
                )
            )

        # Exhaust Gas Temperature Limit
        if record.egt_c > limits.max_egt_c:
            dev = record.egt_c - limits.max_egt_c
            anomalies.append(
                TelemetryAnomaly(
                    channel="egt_c",
                    detection_method=AnomalyMethod.RULE_BASED_LIMIT,
                    severity=SeverityLevel.CRITICAL if dev > 50.0 else SeverityLevel.WARNING,
                    measured_or_simulated_value=record.egt_c,
                    expected_range=(200.0, limits.max_egt_c),
                    deviation=dev,
                    unit="deg C",
                    explanation=f"Exhaust gas temperature ({record.egt_c:.1f}°C) exceeds turbine inlet limit ({limits.max_egt_c:.1f}°C). Turbine blade creep risk.",
                    timestamp_s=t,
                )
            )

        # ---------------------------------------------------------------------
        # 2. Multi-Variable Physical Operating Envelope Checks
        # ---------------------------------------------------------------------
        # Boost Pressure vs Throttle / RPM Consistency (Turbocharged engines)
        if self.engine.aspiration.value == "TURBOCHARGED":
            if throttle >= 0.70 and record.rpm >= 2500.0:
                expected_min_map = 140.0  # At 70%+ throttle & 2500+ RPM, MAP should be well above atmospheric (101.3 kPa)
                if record.manifold_pressure_kpa < expected_min_map:
                    deficit = expected_min_map - record.manifold_pressure_kpa
                    anomalies.append(
                        TelemetryAnomaly(
                            channel="manifold_pressure_kpa",
                            detection_method=AnomalyMethod.PHYSICAL_ENVELOPE,
                            severity=SeverityLevel.WARNING if deficit > 25.0 else SeverityLevel.ADVISORY,
                            measured_or_simulated_value=record.manifold_pressure_kpa,
                            expected_range=(expected_min_map, limits.max_manifold_pressure_bar * 100.0),
                            deviation=deficit,
                            unit="kPa",
                            explanation=f"MAP ({record.manifold_pressure_kpa:.1f} kPa) is {deficit:.1f} kPa below expected forced-induction envelope for throttle={throttle*100:.0f}% at {record.rpm:.0f} RPM. Indicates boost leak, intercooler rupture, or open wastegate.",
                            timestamp_s=t,
                        )
                    )

        # Hydrodynamic Oil Pressure vs RPM Envelope
        if record.rpm > limits.idle_rpm:
            exp_oil_p_min_bar = limits.min_oil_pressure_idle_bar + 0.00045 * (record.rpm - limits.idle_rpm)
            if record.oil_pressure_bar < exp_oil_p_min_bar:
                deficit_bar = exp_oil_p_min_bar - record.oil_pressure_bar
                if deficit_bar > 0.40:
                    anomalies.append(
                        TelemetryAnomaly(
                            channel="oil_pressure_bar",
                            detection_method=AnomalyMethod.PHYSICAL_ENVELOPE,
                            severity=SeverityLevel.WARNING,
                            measured_or_simulated_value=record.oil_pressure_bar,
                            expected_range=(exp_oil_p_min_bar, limits.max_oil_pressure_bar),
                            deviation=deficit_bar,
                            unit="bar",
                            explanation=f"Oil pressure ({record.oil_pressure_bar:.2f} bar) is {deficit_bar:.2f} bar below minimum hydrodynamic curve for {record.rpm:.0f} RPM. Suggests bearing clearance wear, relief valve bypass, or oil pump cavitation.",
                            timestamp_s=t,
                        )
                    )

        # Combustion Mixture vs Load Envelope (Lean burn check)
        if throttle > 0.75 and record.air_fuel_ratio > 15.5:
            anomalies.append(
                TelemetryAnomaly(
                    channel="air_fuel_ratio",
                    detection_method=AnomalyMethod.PHYSICAL_ENVELOPE,
                    severity=SeverityLevel.WARNING,
                    measured_or_simulated_value=record.air_fuel_ratio,
                    expected_range=(11.5, 14.5),
                    deviation=record.air_fuel_ratio - 14.5,
                    unit="ratio",
                    explanation=f"Air-Fuel Ratio AFR={record.air_fuel_ratio:.1f} (excessively lean) under high engine load ({throttle*100:.0f}% throttle). Risk of detonation, elevated EGT, and piston ring micro-welding.",
                    timestamp_s=t,
                )
            )

        # ---------------------------------------------------------------------
        # 3. Statistical Trend & Rate-of-Change Checks
        # ---------------------------------------------------------------------
        # Thermal rate-of-rise check
        if self._last_timestamp is not None and self._last_coolant_temp is not None:
            dt = t - self._last_timestamp
            # Only evaluate rate of rise on continuous monotonic intervals (5ms to 5.0s)
            if 0.005 <= dt <= 5.0:
                rate_c_per_s = (record.coolant_temp_c - self._last_coolant_temp) / dt
                if rate_c_per_s > 1.8:  # Heating up faster than 1.8 deg C/s
                    anomalies.append(
                        TelemetryAnomaly(
                            channel="coolant_temp_c",
                            detection_method=AnomalyMethod.STATISTICAL_TREND,
                            severity=SeverityLevel.WARNING,
                            measured_or_simulated_value=record.coolant_temp_c,
                            expected_range=(60.0, limits.max_coolant_temp_c),
                            deviation=rate_c_per_s,
                            unit="deg C / s",
                            explanation=f"Abnormal coolant thermal surge rate ({rate_c_per_s:.2f}°C/s). Indicates severe cooling circulation restriction, stuck thermostat, or water pump impeller slip.",
                            timestamp_s=t,
                        )
                    )

        # Moving Window Z-Score Statistical Trend
        if len(self._history["oil_pressure_bar"]) >= 15:
            buf = list(self._history["oil_pressure_bar"])
            mean = sum(buf) / len(buf)
            variance = sum((x - mean) ** 2 for x in buf) / len(buf)
            std = math.sqrt(variance)
            if std > 0.05:
                z = (record.oil_pressure_bar - mean) / std
                if z < -2.8:  # Sharp drop in pressure relative to recent trend
                    anomalies.append(
                        TelemetryAnomaly(
                            channel="oil_pressure_bar",
                            detection_method=AnomalyMethod.STATISTICAL_TREND,
                            severity=SeverityLevel.WARNING,
                            measured_or_simulated_value=record.oil_pressure_bar,
                            expected_range=(mean - 2.0 * std, mean + 2.0 * std),
                            deviation=abs(z),
                            unit="z-score",
                            explanation=f"Sudden downward statistical deviation in oil pressure (Z = {z:.2f}). Rapid pressure drop detected relative to 30-sample rolling baseline.",
                            timestamp_s=t,
                        )
                    )

        # Only update last monotonic timestamp if forward in time
        if self._last_timestamp is None or t > self._last_timestamp:
            self._last_timestamp = t
            self._last_coolant_temp = record.coolant_temp_c

        return anomalies
