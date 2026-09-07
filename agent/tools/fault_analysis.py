"""
DHRUVA Tool 3: Fault & Anomaly Event Analysis
Cross-references active fault events, severity classifications, and root-cause indicators.
"""

from typing import Dict, Any, List


def analyze_faults(engine_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyzes active fault events and correlates them with telemetry markers.
    """
    alerts: List[Dict[str, Any]] = data.get("alerts", [])
    engines: List[Dict[str, Any]] = data.get("engines", [])

    # Filter alerts for target engine or all
    target_alerts = []
    for a in alerts:
        eng_match = a.get("engineId") == engine_id or engine_id in ("ALL", "FLEET")
        if eng_match:
            target_alerts.append(a)

    critical_count = sum(1 for a in target_alerts if a.get("severity") == "CRITICAL")
    warning_count = sum(1 for a in target_alerts if a.get("severity") == "WARNING")
    watch_count = sum(1 for a in target_alerts if a.get("severity") in ("WATCH", "NORMAL"))

    # Correlate faults with engine telemetry
    correlated_findings = []
    for a in target_alerts:
        eng_id = a.get("engineId", "")
        matching_eng = next((e for e in engines if e.get("id") == eng_id), None)

        finding_detail = {
            "fault_id": a.get("id"),
            "engine_id": eng_id,
            "severity": a.get("severity"),
            "component": a.get("component"),
            "title": a.get("title"),
            "description": a.get("description"),
            "timestamp": a.get("timestamp"),
            "action_label": a.get("actionLabel", "INSPECT"),
        }

        if matching_eng:
            telem = matching_eng.get("telemetry", {})
            if "BEARING" in a.get("title", "").upper() or "VIBRATION" in a.get("component", "").upper():
                finding_detail["telemetry_correlation"] = (
                    f"Correlated with vibration RMS {telem.get('vibration')} mm/s and harmonic {telem.get('harmonicFreq')} Hz."
                )
            elif "COOLING" in a.get("title", "").upper() or "THERMAL" in a.get("title", "").upper():
                finding_detail["telemetry_correlation"] = (
                    f"Correlated with peak CHT {telem.get('cht')}°C and EGT {telem.get('egt')}°C."
                )
            else:
                finding_detail["telemetry_correlation"] = (
                    f"Telemetry at event: RPM {telem.get('rpm')}, Oil {telem.get('oilPressure')} PSI."
                )

        correlated_findings.append(finding_detail)

    # Risk level synthesis
    if critical_count > 0:
        overall_risk = "HIGH RISK // CRITICAL ANOMALY DETECTED"
    elif warning_count > 0:
        overall_risk = "MODERATE RISK // ACTIVE WARNINGS PRESENT"
    elif len(target_alerts) > 0:
        overall_risk = "LOW RISK // ADVISORIES ACTIVE"
    else:
        overall_risk = "NOMINAL // NO ACTIVE FAULTS LOGGED"

    return {
        "engine_id": engine_id,
        "total_active_faults": len(target_alerts),
        "severity_breakdown": {
            "critical": critical_count,
            "warning": warning_count,
            "watch_or_normal": watch_count,
        },
        "overall_fault_risk": overall_risk,
        "correlated_events": correlated_findings,
        "data_mode": "DEMO ANALYTICS",
    }
