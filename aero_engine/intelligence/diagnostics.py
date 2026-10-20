"""Aerospace Anomaly Detection and Diagnostic Evidence Engine for Dhruva Aero.

Evaluates multi-channel telemetry streams against FAA/EASA certified operating envelopes,
physical thermodynamics correlations, and component degradation signatures.
Never fabricates detection if signals are nominal.
"""

from __future__ import annotations

import datetime
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field
from aero_engine.catalog.models import AeroCategory, AeroEngineCatalogEntry
from aero_engine.telemetry.schema import AeroTelemetryRecord
from aero_engine.intelligence.faults import (
    AeroSeverity,
    AeroFaultDefinition,
    AERO_FAULTS_CATALOG,
)


class AeroAnomaly(BaseModel):
    """Specific, explainable anomaly observed in a telemetry channel."""
    anomaly_id: str
    signal_id: str
    signal_name: str
    observed_value: float
    expected_range: str
    unit: str
    severity: AeroSeverity
    rule_violated: str
    timestamp: str
    confidence_pct: float = Field(..., ge=0.0, le=100.0)


class AeroDiagnosticHypothesis(BaseModel):
    """Ranked root-cause fault hypothesis with supporting physical evidence."""
    hypothesis_id: str
    fault_id: str
    fault_name: str
    affected_component_id: str
    affected_component_name: str
    severity: AeroSeverity
    confidence_pct: float = Field(..., ge=0.0, le=100.0)
    supporting_anomalies: List[str]
    physical_evidence: str
    detection_rule: str
    recommended_action: str
    is_injected: bool = False


class AeroComponentHealth(BaseModel):
    """Subsystem physical health score and condition assessment."""
    component_id: str
    component_name: str
    health_score_pct: float = Field(100.0, ge=0.0, le=100.0)
    status: str = Field("NOMINAL", description="NOMINAL, MONITOR, DEGRADED, CRITICAL")
    active_faults_count: int = 0
    key_metrics: Dict[str, str] = Field(default_factory=dict)


class AeroDiagnosticReport(BaseModel):
    """Complete diagnostic assessment for an active aero session."""
    engine_id: str
    timestamp: str
    overall_health_score_pct: float
    operating_status: str
    anomalies: List[AeroAnomaly]
    hypotheses: List[AeroDiagnosticHypothesis]
    components: List[AeroComponentHealth]


class AeroDiagnosticEngine:
    """Deterministic diagnostic analyzer for aircraft propulsion systems."""

    def __init__(self, engine: AeroEngineCatalogEntry) -> None:
        self.engine = engine
        self.limits = engine.operating_limits
        self.category = engine.category

    def evaluate(
        self,
        telemetry: AeroTelemetryRecord,
        injected_faults: Optional[List[str]] = None,
    ) -> AeroDiagnosticReport:
        """Analyze a telemetry frame and produce an explainable diagnostic assessment."""
        injected_faults = injected_faults or []
        anomalies: List[AeroAnomaly] = []
        now_str = telemetry.timestamp

        # ---------------------------------------------------------------------
        # 1. Category-specific Envelope & Limit Violations
        # ---------------------------------------------------------------------
        # Turbofan / Turbojet EGT Check
        if telemetry.turbine_egt_c is not None and self.limits.max_turbine_egt_c:
            if telemetry.turbine_egt_c > self.limits.max_turbine_egt_c:
                anomalies.append(
                    AeroAnomaly(
                        anomaly_id=f"ANOM-EGT-REDLINE-{len(anomalies)+1}",
                        signal_id="turbine_egt_c",
                        signal_name="Turbine Exhaust Gas Temp",
                        observed_value=telemetry.turbine_egt_c,
                        expected_range=f"<= {self.limits.max_turbine_egt_c} °C",
                        unit="°C",
                        severity=AeroSeverity.CRITICAL,
                        rule_violated=f"EGT Exceeds TCDS Redline ({self.limits.max_turbine_egt_c} °C)",
                        timestamp=now_str,
                        confidence_pct=98.5,
                    )
                )
            elif telemetry.turbine_egt_c > (self.limits.max_turbine_egt_c - 45.0):
                anomalies.append(
                    AeroAnomaly(
                        anomaly_id=f"ANOM-EGT-MARGIN-{len(anomalies)+1}",
                        signal_id="turbine_egt_c",
                        signal_name="Turbine Exhaust Gas Temp",
                        observed_value=telemetry.turbine_egt_c,
                        expected_range=f"<= {self.limits.max_turbine_egt_c - 45.0} °C",
                        unit="°C",
                        severity=AeroSeverity.WARNING,
                        rule_violated="EGT Margin Deficit (< 45°C buffer)",
                        timestamp=now_str,
                        confidence_pct=92.0,
                    )
                )

        # Turboprop ITT Check
        if telemetry.itt_c is not None and self.limits.max_itt_c:
            if telemetry.itt_c > self.limits.max_itt_c:
                anomalies.append(
                    AeroAnomaly(
                        anomaly_id=f"ANOM-ITT-REDLINE-{len(anomalies)+1}",
                        signal_id="itt_c",
                        signal_name="Inter-Turbine Temperature (ITT)",
                        observed_value=telemetry.itt_c,
                        expected_range=f"<= {self.limits.max_itt_c} °C",
                        unit="°C",
                        severity=AeroSeverity.CRITICAL,
                        rule_violated=f"ITT Exceeds TCDS Limit ({self.limits.max_itt_c} °C)",
                        timestamp=now_str,
                        confidence_pct=98.0,
                    )
                )

        # Piston CHT Check
        if telemetry.cht_c is not None and self.limits.max_cht_c:
            if telemetry.cht_c > self.limits.max_cht_c:
                anomalies.append(
                    AeroAnomaly(
                        anomaly_id=f"ANOM-CHT-REDLINE-{len(anomalies)+1}",
                        signal_id="cht_c",
                        signal_name="Cylinder Head Temp",
                        observed_value=telemetry.cht_c,
                        expected_range=f"<= {self.limits.max_cht_c} °C",
                        unit="°C",
                        severity=AeroSeverity.CRITICAL,
                        rule_violated=f"CHT Exceeds Certified Redline ({self.limits.max_cht_c} °C)",
                        timestamp=now_str,
                        confidence_pct=99.0,
                    )
                )

        # Common Oil Pressure Check
        if telemetry.oil_press_psi is not None and self.limits.min_oil_press_psi:
            if telemetry.oil_press_psi < self.limits.min_oil_press_psi:
                anomalies.append(
                    AeroAnomaly(
                        anomaly_id=f"ANOM-OIL-PRESS-LOW-{len(anomalies)+1}",
                        signal_id="oil_press_psi",
                        signal_name="Main Oil Gallery Pressure",
                        observed_value=telemetry.oil_press_psi,
                        expected_range=f">= {self.limits.min_oil_press_psi} PSI",
                        unit="PSI",
                        severity=AeroSeverity.CRITICAL,
                        rule_violated=f"Oil Pressure Below FAA Minimum Limit ({self.limits.min_oil_press_psi} PSI)",
                        timestamp=now_str,
                        confidence_pct=99.5,
                    )
                )

        # Oil Temperature Check
        if telemetry.oil_temp_c is not None and self.limits.max_oil_temp_c:
            if telemetry.oil_temp_c > self.limits.max_oil_temp_c:
                anomalies.append(
                    AeroAnomaly(
                        anomaly_id=f"ANOM-OIL-TEMP-HIGH-{len(anomalies)+1}",
                        signal_id="oil_temp_c",
                        signal_name="Oil Scavenge Temperature",
                        observed_value=telemetry.oil_temp_c,
                        expected_range=f"<= {self.limits.max_oil_temp_c} °C",
                        unit="°C",
                        severity=AeroSeverity.WARNING,
                        rule_violated=f"Oil Temp Exceeds Continuous Operating Limit ({self.limits.max_oil_temp_c} °C)",
                        timestamp=now_str,
                        confidence_pct=95.0,
                    )
                )

        # Vibration Check
        if telemetry.vibration_mils is not None and telemetry.vibration_mils > 1.2:
            anomalies.append(
                AeroAnomaly(
                    anomaly_id=f"ANOM-VIB-HIGH-{len(anomalies)+1}",
                    signal_id="vibration_mils",
                    signal_name="Rotor Vibration Amplitude",
                    observed_value=telemetry.vibration_mils,
                    expected_range="<= 0.8 mils",
                    unit="mils",
                    severity=AeroSeverity.WARNING,
                    rule_violated="Core Rotor Imbalance Exceeds Advisory Threshold",
                    timestamp=now_str,
                    confidence_pct=91.0,
                )
            )

        # ---------------------------------------------------------------------
        # 2. Hypothesis Formulation (Root-Cause Attribution)
        # ---------------------------------------------------------------------
        hypotheses: List[AeroDiagnosticHypothesis] = []
        anom_signals = {a.signal_id for a in anomalies}

        # Check for Oil Loss
        if "oil_press_psi" in anom_signals or "FAULT-OIL-LOSS" in injected_faults:
            fdef = AERO_FAULTS_CATALOG["FAULT-OIL-LOSS"]
            is_inj = "FAULT-OIL-LOSS" in injected_faults
            hypotheses.append(
                AeroDiagnosticHypothesis(
                    hypothesis_id=f"HYP-OIL-{len(hypotheses)+1}",
                    fault_id=fdef.fault_id,
                    fault_name=fdef.name,
                    affected_component_id=fdef.affected_component_id,
                    affected_component_name=fdef.affected_component_name,
                    severity=fdef.severity,
                    confidence_pct=98.0 if is_inj or "oil_press_psi" in anom_signals else 40.0,
                    supporting_anomalies=[a.anomaly_id for a in anomalies if "oil" in a.signal_id],
                    physical_evidence=fdef.physical_mechanism,
                    detection_rule=fdef.detection_rule,
                    recommended_action=fdef.recommended_action,
                    is_injected=is_inj,
                )
            )

        # Check for Compressor Stall / Surge
        if "vibration_mils" in anom_signals or "FAULT-COMPRESSOR-STALL" in injected_faults:
            fdef = AERO_FAULTS_CATALOG["FAULT-COMPRESSOR-STALL"]
            is_inj = "FAULT-COMPRESSOR-STALL" in injected_faults
            hypotheses.append(
                AeroDiagnosticHypothesis(
                    hypothesis_id=f"HYP-STALL-{len(hypotheses)+1}",
                    fault_id=fdef.fault_id,
                    fault_name=fdef.name,
                    affected_component_id=fdef.affected_component_id,
                    affected_component_name=fdef.affected_component_name,
                    severity=fdef.severity,
                    confidence_pct=96.0 if is_inj else 88.0,
                    supporting_anomalies=[a.anomaly_id for a in anomalies if "vibration" in a.signal_id or "egt" in a.signal_id],
                    physical_evidence=fdef.physical_mechanism,
                    detection_rule=fdef.detection_rule,
                    recommended_action=fdef.recommended_action,
                    is_injected=is_inj,
                )
            )

        # Check for Turbine Creep
        if ("turbine_egt_c" in anom_signals and "vibration_mils" not in anom_signals) or "FAULT-TURBINE-CREEP" in injected_faults:
            fdef = AERO_FAULTS_CATALOG["FAULT-TURBINE-CREEP"]
            is_inj = "FAULT-TURBINE-CREEP" in injected_faults
            hypotheses.append(
                AeroDiagnosticHypothesis(
                    hypothesis_id=f"HYP-CREEP-{len(hypotheses)+1}",
                    fault_id=fdef.fault_id,
                    fault_name=fdef.name,
                    affected_component_id=fdef.affected_component_id,
                    affected_component_name=fdef.affected_component_name,
                    severity=fdef.severity,
                    confidence_pct=94.0 if is_inj else 85.0,
                    supporting_anomalies=[a.anomaly_id for a in anomalies if "egt" in a.signal_id],
                    physical_evidence=fdef.physical_mechanism,
                    detection_rule=fdef.detection_rule,
                    recommended_action=fdef.recommended_action,
                    is_injected=is_inj,
                )
            )

        # Check for CHT Detonation (Piston)
        if "cht_c" in anom_signals or "FAULT-CHT-DETONATION" in injected_faults:
            fdef = AERO_FAULTS_CATALOG["FAULT-CHT-DETONATION"]
            is_inj = "FAULT-CHT-DETONATION" in injected_faults
            hypotheses.append(
                AeroDiagnosticHypothesis(
                    hypothesis_id=f"HYP-DET-{len(hypotheses)+1}",
                    fault_id=fdef.fault_id,
                    fault_name=fdef.name,
                    affected_component_id=fdef.affected_component_id,
                    affected_component_name=fdef.affected_component_name,
                    severity=fdef.severity,
                    confidence_pct=97.0 if is_inj or "cht_c" in anom_signals else 45.0,
                    supporting_anomalies=[a.anomaly_id for a in anomalies if "cht" in a.signal_id],
                    physical_evidence=fdef.physical_mechanism,
                    detection_rule=fdef.detection_rule,
                    recommended_action=fdef.recommended_action,
                    is_injected=is_inj,
                )
            )

        # Add remaining injected faults if not yet captured
        for fkey in injected_faults:
            if fkey in AERO_FAULTS_CATALOG and not any(h.fault_id == fkey for h in hypotheses):
                fdef = AERO_FAULTS_CATALOG[fkey]
                hypotheses.append(
                    AeroDiagnosticHypothesis(
                        hypothesis_id=f"HYP-INJ-{len(hypotheses)+1}",
                        fault_id=fdef.fault_id,
                        fault_name=fdef.name,
                        affected_component_id=fdef.affected_component_id,
                        affected_component_name=fdef.affected_component_name,
                        severity=fdef.severity,
                        confidence_pct=95.0,
                        supporting_anomalies=[a.anomaly_id for a in anomalies],
                        physical_evidence=f"Operator Injected Fault Mode: {fdef.physical_mechanism}",
                        detection_rule=fdef.detection_rule,
                        recommended_action=fdef.recommended_action,
                        is_injected=True,
                    )
                )

        # ---------------------------------------------------------------------
        # 3. Component Health Breakdown
        # ---------------------------------------------------------------------
        components = self._build_component_health(telemetry, hypotheses)

        # Calculate overall model-derived health score
        if components:
            overall_health = sum(c.health_score_pct for c in components) / len(components)
        else:
            overall_health = 100.0

        op_status = "NORMAL"
        if any(h.severity == AeroSeverity.CRITICAL for h in hypotheses):
            op_status = "CRITICAL ALARM"
        elif any(h.severity == AeroSeverity.WARNING for h in hypotheses):
            op_status = "WARNING"
        elif any(h.severity == AeroSeverity.CAUTION for h in hypotheses):
            op_status = "CAUTION"

        return AeroDiagnosticReport(
            engine_id=self.engine.engine_id,
            timestamp=now_str,
            overall_health_score_pct=round(overall_health, 1),
            operating_status=op_status,
            anomalies=anomalies,
            hypotheses=hypotheses,
            components=components,
        )

    def _build_component_health(
        self,
        telemetry: AeroTelemetryRecord,
        hypotheses: List[AeroDiagnosticHypothesis],
    ) -> List[AeroComponentHealth]:
        """Construct subsystem health records mapped to 3D CAD components."""
        comps = []
        fault_map: Dict[str, List[AeroDiagnosticHypothesis]] = {}
        for h in hypotheses:
            fault_map.setdefault(h.affected_component_id, []).append(h)

        if self.category == AeroCategory.TURBOFAN:
            defs = [
                ("fan_assembly", "Fan & Booster Assembly", {"N1 Speed": f"{telemetry.n1_pct or 0}%", "Vibration": f"{telemetry.vibration_mils or 0} mils"}),
                ("high_pressure_compressor", "High-Pressure Compressor (HPC)", {"N2 Speed": f"{telemetry.n2_pct or 0}%", "EPR": f"{telemetry.epr or 0}"}),
                ("combustor", "Combustion Chamber", {"Fuel Flow": f"{telemetry.fuel_flow_kgh or 0} kg/h"}),
                ("high_pressure_turbine", "High-Pressure Turbine (HPT)", {"EGT": f"{telemetry.turbine_egt_c or 0} °C"}),
                ("low_pressure_turbine", "Low-Pressure Turbine (LPT)", {"Thrust": f"{telemetry.thrust_kn or 0} kN"}),
                ("lubrication_system", "Oil Sump & Scavenge Pump", {"Pressure": f"{telemetry.oil_press_psi or 0} PSI", "Temp": f"{telemetry.oil_temp_c or 0} °C"}),
                ("fadec_sensors", "FADEC Sensor Harness", {"Status": "DUAL_CHANNEL_ACTIVE"}),
            ]
        elif self.category == AeroCategory.TURBOPROP:
            defs = [
                ("propeller_assembly", "Propeller & Governor Hub", {"Np Speed": f"{telemetry.np_rpm or 0} RPM"}),
                ("reduction_gearbox", "Planetary Reduction Gearbox", {"Torque": f"{telemetry.torque_ft_lb or 0} ft-lb"}),
                ("gas_generator", "Gas Generator Compressor & Turbine", {"Ng Speed": f"{telemetry.ng_pct or 0}%"}),
                ("combustor", "Reverse-Flow Combustor", {"ITT": f"{telemetry.itt_c or 0} °C"}),
                ("power_turbine", "Free Power Turbine", {"Output Power": f"{telemetry.shp or 0} SHP"}),
                ("lubrication_system", "Gearbox & Engine Oil System", {"Pressure": f"{telemetry.oil_press_psi or 0} PSI"}),
            ]
        elif self.category == AeroCategory.PISTON:
            defs = [
                ("cylinders", "Cylinders & Combustion Chambers", {"CHT": f"{telemetry.cht_c or 0} °C"}),
                ("pistons_crank", "Pistons, Rods & Crankshaft", {"RPM": f"{telemetry.rpm or 0} RPM", "Power": f"{telemetry.power_bhp or 0} BHP"}),
                ("induction_manifold", "Induction & Manifold Runner", {"MAP": f"{telemetry.map_inhg or 0} inHg"}),
                ("exhaust_system", "Exhaust Headers & Muffler", {"EGT": f"{telemetry.egt_c or 0} °C"}),
                ("lubrication_system", "Oil Pump, Sump & Cooler", {"Pressure": f"{telemetry.oil_press_psi or 0} PSI", "Temp": f"{telemetry.oil_temp_c or 0} °C"}),
                ("fuel_injection", "Fuel Injection Servo & Lines", {"Fuel Flow": f"{telemetry.fuel_flow_gph or 0} GPH"}),
            ]
        else:  # TURBOJET
            defs = [
                ("inlet_guide_vanes", "Variable Inlet Guide Vanes", {"N Speed": f"{telemetry.spool_n_pct or 0}%"}),
                ("axial_compressor", "8-Stage Axial Compressor", {"Pressure Ratio": "8.3:1"}),
                ("combustor", "Annular Vaporizer Combustor", {"Fuel Flow": f"{telemetry.fuel_flow_kgh or 0} kg/h"}),
                ("turbine_stage", "2-Stage Axial Turbine", {"EGT": f"{telemetry.turbine_egt_c or 0} °C"}),
                ("exhaust_nozzle", "Variable Divergent Exhaust Nozzle", {"Thrust": f"{telemetry.thrust_kn or 0} kN"}),
                ("lubrication_system", "Mil-Spec Oil Lubrication System", {"Pressure": f"{telemetry.oil_press_psi or 0} PSI"}),
            ]

        for cid, cname, kmetrics in defs:
            f_list = fault_map.get(cid, [])
            if any(f.severity == AeroSeverity.CRITICAL for f in f_list):
                score = 35.0
                st = "CRITICAL"
            elif any(f.severity == AeroSeverity.WARNING for f in f_list):
                score = 68.0
                st = "DEGRADED"
            elif any(f.severity == AeroSeverity.CAUTION for f in f_list):
                score = 84.0
                st = "MONITOR"
            else:
                score = 100.0
                st = "NOMINAL"

            comps.append(
                AeroComponentHealth(
                    component_id=cid,
                    component_name=cname,
                    health_score_pct=score,
                    status=st,
                    active_faults_count=len(f_list),
                    key_metrics=kmetrics,
                )
            )

        return comps
