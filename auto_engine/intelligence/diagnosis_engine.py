"""Traceable Root-Cause Diagnostic Reasoning Engine.

Synthesizes detected telemetry anomalies and subsystem dependency graphs
into ranked diagnostic hypotheses with calibrated confidence, uncertainty bounds,
supporting evidence, and physical inspection recommendations.
"""

from __future__ import annotations

from typing import List, Dict, Optional, Tuple
from pydantic import BaseModel

from auto_engine.catalog.models import EngineCatalogEntry
from auto_engine.telemetry.schema import EngineTelemetryRecord
from auto_engine.intelligence.models import (
    TelemetryAnomaly,
    DiagnosticHypothesis,
    SeverityLevel,
    SubsystemType,
)
from auto_engine.intelligence.fault_graph import (
    FAULT_MODES_CATALOG,
    FaultModeDefinition,
)


class DiagnosticEngine:
    """Evaluates telemetry anomalies against failure mode symptom graphs to generate hypotheses.

    Enforces engineering integrity:
    1. Hypotheses are never reported as confirmed failures without physical inspection.
    2. Confidence scores are bounded and accompanied by uncertainty intervals.
    3. Both supporting and refuting evidence are explicitly cataloged.
    """

    def __init__(self, engine: EngineCatalogEntry):
        self.engine = engine
        self._hypo_counter = 1

    def diagnose(
        self,
        anomalies: List[TelemetryAnomaly],
        current_telemetry: Optional[EngineTelemetryRecord] = None,
    ) -> List[DiagnosticHypothesis]:
        """Generate ranked diagnostic hypotheses from observed telemetry anomalies."""
        if not anomalies:
            return []

        from collections import defaultdict
        anom_by_channel: Dict[str, List[TelemetryAnomaly]] = defaultdict(list)
        for a in anomalies:
            anom_by_channel[a.channel].append(a)

        hypotheses: List[DiagnosticHypothesis] = []
        severity_rank = {
            SeverityLevel.NOMINAL: 0,
            SeverityLevel.ADVISORY: 1,
            SeverityLevel.WARNING: 2,
            SeverityLevel.CRITICAL: 3,
        }

        for fault_key, fault_def in FAULT_MODES_CATALOG.items():
            primary_matches: List[TelemetryAnomaly] = []
            secondary_matches: List[TelemetryAnomaly] = []
            missing_primary: List[str] = []
            matched_primary_symptoms: List[str] = []

            for symp in fault_def.primary_symptoms:
                if symp in anom_by_channel:
                    primary_matches.extend(anom_by_channel[symp])
                    matched_primary_symptoms.append(symp)
                else:
                    missing_primary.append(symp)

            for symp in fault_def.secondary_symptoms:
                if symp in anom_by_channel:
                    secondary_matches.extend(anom_by_channel[symp])

            # If no primary symptoms matched, skip this fault mode
            if not matched_primary_symptoms:
                continue

            # Calculate evidence-weighted confidence score
            # Base evidence weight from primary symptoms matched
            score = 0.35 * (len(matched_primary_symptoms) / len(fault_def.primary_symptoms))

            # Severity boost from matched primary symptoms (take highest severity per symptom)
            for symp in matched_primary_symptoms:
                highest_sev = max(
                    (a.severity for a in anom_by_channel[symp]),
                    key=lambda s: severity_rank.get(s, 0)
                )
                if highest_sev == SeverityLevel.CRITICAL:
                    score += 0.30
                elif highest_sev == SeverityLevel.WARNING:
                    score += 0.20
                elif highest_sev == SeverityLevel.ADVISORY:
                    score += 0.10

            # Boost from secondary corroborating symptoms
            if fault_def.secondary_symptoms:
                # Count distinct secondary symptoms matched
                matched_secondary = [s for s in fault_def.secondary_symptoms if s in anom_by_channel]
                sec_ratio = len(matched_secondary) / len(fault_def.secondary_symptoms)
                score += 0.20 * sec_ratio

            # Clamp confidence: never 1.0 (telemetry alone cannot be 100% physically conclusive)
            confidence = min(0.95, max(0.20, score))

            # Uncertainty interval calculation based on evidence completeness
            uncertainty_width = 0.20 if len(missing_primary) > 0 else 0.10
            low_bound = max(0.05, round(confidence - uncertainty_width, 2))
            high_bound = min(0.99, round(confidence + uncertainty_width, 2))

            # Format supporting evidence strings
            supporting: List[str] = []
            for anom in primary_matches:
                supporting.append(
                    f"Primary: {anom.channel} anomaly ({anom.measured_or_simulated_value:.1f} {anom.unit}) - {anom.explanation}"
                )
            for anom in secondary_matches:
                supporting.append(
                    f"Secondary: Corroborating {anom.channel} deviation ({anom.measured_or_simulated_value:.1f} {anom.unit})"
                )

            # Format refuting / unobserved evidence strings
            refuting: List[str] = []
            if missing_primary:
                for symp in missing_primary:
                    refuting.append(
                        f"Expected primary symptom '{symp}' was within nominal limits (not triggered)."
                    )
            if not secondary_matches and fault_def.secondary_symptoms:
                refuting.append(
                    f"Cascading secondary symptoms ({', '.join(fault_def.secondary_symptoms)}) have not yet manifested."
                )

            # Determine overall severity
            worst_severity = SeverityLevel.ADVISORY
            all_matches = primary_matches + secondary_matches
            for m in all_matches:
                if m.severity == SeverityLevel.CRITICAL:
                    worst_severity = SeverityLevel.CRITICAL
                    break
                elif m.severity == SeverityLevel.WARNING:
                    worst_severity = SeverityLevel.WARNING

            hypo_id = f"HYP-{fault_def.origin_subsystem.value[:4]}-{self._hypo_counter:03d}"
            self._hypo_counter += 1

            hypotheses.append(
                DiagnosticHypothesis(
                    hypothesis_id=hypo_id,
                    fault_id=fault_def.fault_id,
                    fault_name=fault_def.name,
                    subsystem=fault_def.origin_subsystem,
                    severity=worst_severity,
                    confidence=round(confidence, 3),
                    uncertainty_bounds=(low_bound, high_bound),
                    propagation_path=[sub.value for sub in fault_def.propagation_path],
                    supporting_evidence=supporting,
                    refuting_evidence=refuting,
                    recommended_inspections=fault_def.recommended_inspections,
                    is_hypothesis=True,
                )
            )

        # Sort by confidence descending
        hypotheses.sort(key=lambda h: h.confidence, reverse=True)
        return hypotheses
