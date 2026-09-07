"""
DHRUVA Tool 6: Tuning Profile Comparison & Tradeoff Simulator
Evaluates aero-engine performance tradeoffs across governor, mixture, and spark profiles.
Advisory only — does not directly command FADEC.
"""

from typing import Dict, Any, List


TUNING_PROFILES = {
    "profile_a_endurance": {
        "name": "Profile A (Lean Cruise / High Endurance Map)",
        "intended_use": "Long-endurance loiter and high-altitude cruise",
        "delta_fuel_flow_pct": -9.5,
        "delta_cht_c": +4.0,
        "delta_egt_c": +18.0,
        "delta_vibration_pct": -4.0,
        "throttle_response_penalty_ms": +85.0,
        "stability_index": "HIGH",
        "pros": ["Maximizes loiter flight duration (+42 min on standard tank)", "Reduced structural vibration"],
        "cons": ["Slower throttle step recovery (+85ms lag)", "Slightly elevated peak EGT"],
    },
    "profile_b_agility": {
        "name": "Profile B (High Agility / Rapid Transient Map)",
        "intended_use": "Dynamic maneuvers, formation flight, rapid altitude step",
        "delta_fuel_flow_pct": +12.0,
        "delta_cht_c": +12.5,
        "delta_egt_c": -10.0,
        "delta_vibration_pct": +8.5,
        "throttle_response_penalty_ms": -110.0,
        "stability_index": "MEDIUM-HIGH",
        "pros": ["Crisp transient response (-110ms latency)", "Higher peak climb thrust"],
        "cons": ["Elevated fuel burn (+12%)", "Increased thermal load on cylinder heads (+12.5°C)"],
    },
    "profile_c_thermal_conservative": {
        "name": "Profile C (Thermal Conservative / High Reliability Map)",
        "intended_use": "Hot weather operations, engines with degraded cooling baffles",
        "delta_fuel_flow_pct": +4.0,
        "delta_cht_c": -16.0,
        "delta_egt_c": -22.0,
        "delta_vibration_pct": -2.0,
        "throttle_response_penalty_ms": +25.0,
        "stability_index": "VERY HIGH",
        "pros": ["Substantial CHT reduction (-16°C)", "Extended RUL lifespan on hot cylinders"],
        "cons": ["Minor fuel penalty (+4%)", "Slight governor softening"],
    },
}


def simulate_tuning(engine_id: str, tuning_profile: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Compares candidate tuning profiles against the current engine baseline.
    Returns clear tradeoff matrices and mission-aligned recommendations.
    """
    engines: List[Dict[str, Any]] = data.get("engines", [])
    target_engine = None
    for eng in engines:
        if eng.get("id") == engine_id or eng.get("name") == engine_id:
            target_engine = eng
            break

    if not target_engine and engines:
        target_engine = engines[0]

    if not target_engine:
        return {
            "status": "error",
            "message": f"Engine {engine_id} not available for tuning simulation.",
            "data_mode": "DEMO SIMULATION",
        }

    telem = target_engine.get("telemetry", {})
    base_fuel = float(telem.get("fuelFlow", 32.0))
    base_cht = float(telem.get("cht", 175.0))
    base_egt = float(telem.get("egt", 690.0))
    base_vib = float(telem.get("vibration", 2.0))

    # Evaluate each profile against current baseline
    evaluated_profiles = []
    for key, p in TUNING_PROFILES.items():
        sim_fuel = round(base_fuel * (1.0 + (p["delta_fuel_flow_pct"] / 100.0)), 1)
        sim_cht = round(base_cht + p["delta_cht_c"], 1)
        sim_egt = round(base_egt + p["delta_egt_c"], 1)
        sim_vib = round(base_vib * (1.0 + (p["delta_vibration_pct"] / 100.0)), 2)

        evaluated_profiles.append({
            "profile_key": key,
            "name": p["name"],
            "intended_use": p["intended_use"],
            "simulated_metrics": {
                "fuel_flow_l_hr": sim_fuel,
                "cht_c": sim_cht,
                "egt_c": sim_egt,
                "vibration_mm_s": sim_vib,
                "throttle_latency_delta_ms": p["throttle_response_penalty_ms"],
            },
            "pros": p["pros"],
            "cons": p["cons"],
            "stability": p["stability_index"],
        })

    # Contextual recommendation based on query & engine status
    query_str = (tuning_profile or "").lower()
    if "endurance" in query_str or "loiter" in query_str or "fuel" in query_str:
        recommended_key = "profile_a_endurance"
        rec_reason = "Profile A provides maximum fuel conservation (+42 min loiter) with minimal vibration penalty."
    elif "hot" in query_str or base_cht > 205:
        recommended_key = "profile_c_thermal_conservative"
        rec_reason = "Profile C is critical to bring elevated CHT below thermal damage thresholds (-16°C CHT relief)."
    else:
        recommended_key = "profile_a_endurance"
        rec_reason = "Profile A delivers the best overall endurance envelope for standard MALE reconnaissance."

    return {
        "engine_id": target_engine.get("id"),
        "candidate_profiles": evaluated_profiles,
        "recommended_profile": recommended_key,
        "recommendation_rationale": rec_reason,
        "advisory_disclaimer": "Advisory tuning simulation. Copilot does not directly rewrite FADEC ROM tables.",
        "data_mode": "DEMO SIMULATION",
    }
