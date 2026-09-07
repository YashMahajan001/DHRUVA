"""
DHRUVA Tool 7: Maintenance Advisory & Fleet Prioritization
Synthesizes multi-engine telemetry, faults, RUL, and stress metrics to generate
prioritized MRO maintenance recommendations and fleet inspection queues.
"""

from typing import Dict, Any, List


def get_maintenance_advice(engine_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Evaluates maintenance priorities across single engine or entire fleet using
    multi-indicator scoring (Health, RUL, Faults, Vibration, Throttle Response).
    """
    engines: List[Dict[str, Any]] = data.get("engines", [])
    alerts: List[Dict[str, Any]] = data.get("alerts", [])
    mro_tasks: List[Dict[str, Any]] = data.get("mro_tasks", [])

    # Score each engine in fleet across multiple indicators
    fleet_rankings = []
    for eng in engines:
        eid = eng.get("id", "")
        health = float(eng.get("health", 90))
        rul = float(eng.get("rul", 100))
        telem = eng.get("telemetry", {})
        vib = float(telem.get("vibration", 2.0))
        cht = float(telem.get("cht", 175.0))
        oil_p = float(telem.get("oilPressure", 80.0))

        # Fault count & severity weighting
        eng_alerts = [a for a in alerts if a.get("engineId") == eid]
        crit_alerts = sum(1 for a in eng_alerts if a.get("severity") == "CRITICAL")
        warn_alerts = sum(1 for a in eng_alerts if a.get("severity") == "WARNING")

        # Multi-indicator urgency score calculation (higher = more urgent)
        # 1. Health deficit (0 to 100)
        health_deficit = max(0.0, 100.0 - health)
        # 2. RUL deficit (0 to 100, where <= 20 hrs is 100)
        rul_deficit = max(0.0, min(100.0, (200.0 - rul) * 0.5))
        if rul <= 25.0:
            rul_deficit = 100.0
        # 3. Vibration penalty
        vib_penalty = max(0.0, (vib - 2.0) * 25.0)
        # 4. Fault penalty
        fault_penalty = (crit_alerts * 40.0) + (warn_alerts * 20.0)
        # 5. Thermal penalty
        thermal_penalty = max(0.0, (cht - 180.0) * 1.5)

        composite_urgency = round(
            (health_deficit * 0.25)
            + (rul_deficit * 0.30)
            + (vib_penalty * 0.20)
            + (fault_penalty * 0.15)
            + (thermal_penalty * 0.10),
            1
        )

        reasons = []
        if rul <= 25.0:
            reasons.append(f"RUL critical at {rul} operating hours")
        if health < 60:
            reasons.append(f"Health index ({health}%) severely below fleet baseline")
        if vib > 4.0:
            reasons.append(f"Excessive vibration ({vib} mm/s RMS) indicating mechanical fatigue")
        if crit_alerts > 0:
            reasons.append(f"{crit_alerts} critical unacknowledged fault(s) logged")
        if cht > 210:
            reasons.append(f"Thermal degradation with CHT at {cht}°C")

        fleet_rankings.append({
            "engine_id": eid,
            "engine_name": eng.get("name"),
            "health": health,
            "rul_hours": rul,
            "vibration_mm_s": vib,
            "cht_c": cht,
            "urgency_score": composite_urgency,
            "critical_flags": reasons,
        })

    # Sort descending by urgency score
    fleet_rankings.sort(key=lambda x: x["urgency_score"], reverse=True)
    top_priority_engine = fleet_rankings[0] if fleet_rankings else None

    # MRO task correlation for active or top engine
    target_id = engine_id if engine_id not in ("ALL", "FLEET") else (top_priority_engine["engine_id"] if top_priority_engine else "ENG 01")
    relevant_tasks = [t for t in mro_tasks if t.get("engineId") == target_id]

    # Specific actionable recommendations
    action_items = []
    if top_priority_engine:
        if top_priority_engine["vibration_mm_s"] > 4.0 or top_priority_engine["rul_hours"] < 25:
            action_items.append(f"1. Perform acoustic borescope inspection of {top_priority_engine['engine_id']} crank journal bearings.")
            action_items.append(f"2. Stage Spare Assembly PK-320-B for potential hot-section turnaround.")
        if any(f["cht_c"] > 210 for f in fleet_rankings):
            action_items.append("3. Check nacelle intake scoop and baffle seal integrity on hot cylinders.")
        action_items.append("4. Verify oil spectrometric particulate levels before subsequent sortie release.")

    return {
        "evaluation_target": engine_id,
        "highest_priority_engine": top_priority_engine["engine_id"] if top_priority_engine else "NONE",
        "priority_rationale": top_priority_engine["critical_flags"] if top_priority_engine else [],
        "fleet_maintenance_queue": fleet_rankings,
        "scheduled_mro_tasks": relevant_tasks,
        "recommended_actions": action_items,
        "data_mode": "DEMO ANALYTICS",
        "advisory_disclaimer": "Advisory MRO queue for engineering decision support.",
    }
