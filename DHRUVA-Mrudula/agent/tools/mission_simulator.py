"""
DHRUVA Tool 5: Mission Readiness & Flight Profile Simulator
Evaluates propulsion system survivability, endurance capacity, and thermal margins
against tactical MALE UAV mission profiles.
"""

from typing import Dict, Any, List


MISSION_PROFILES = {
    "high_altitude_isr": {
        "name": "High-Altitude ISR (Autonomous Reconnaissance)",
        "target_altitude_ft": 24000,
        "target_duration_hours": 6.0,
        "required_health_min": 75,
        "min_rul_hours": 30.0,
        "max_vibration_limit": 3.8,
        "max_cht_limit": 215.0,
        "ambient_temp_c": -22.0,
        "manifold_stress_factor": 1.25,
    },
    "long_endurance": {
        "name": "Extended Loiter Endurance (6-12 Hours)",
        "target_altitude_ft": 18000,
        "target_duration_hours": 6.0,
        "required_health_min": 70,
        "min_rul_hours": 25.0,
        "max_vibration_limit": 3.5,
        "max_cht_limit": 205.0,
        "ambient_temp_c": -10.0,
        "manifold_stress_factor": 1.10,
    },
    "hot_weather": {
        "name": "Hot & High Surface Deployment (+40°C Ambient)",
        "target_altitude_ft": 12000,
        "target_duration_hours": 4.0,
        "required_health_min": 80,
        "min_rul_hours": 40.0,
        "max_vibration_limit": 3.2,
        "max_cht_limit": 195.0,
        "ambient_temp_c": 40.0,
        "manifold_stress_factor": 1.35,
    },
    "rapid_throttle_transitions": {
        "name": "Dynamic Agility & Terrain Following",
        "target_altitude_ft": 8000,
        "target_duration_hours": 2.5,
        "required_health_min": 80,
        "min_rul_hours": 35.0,
        "max_vibration_limit": 3.0,
        "max_cht_limit": 200.0,
        "ambient_temp_c": 15.0,
        "manifold_stress_factor": 1.40,
    },
}


def simulate_mission(engine_id: str, mission_profile: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Simulates operational capability for a specified mission profile.
    Returns structured readiness: NOMINAL | CONDITIONAL | REVIEW REQUIRED | NOT RECOMMENDED.
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
            "message": f"Engine {engine_id} not available for mission simulation.",
            "data_mode": "DEMO SIMULATION",
        }

    # Match mission profile
    profile_key = "long_endurance"
    p_norm = (mission_profile or "").lower()
    if "high" in p_norm or "isr" in p_norm or "altitude" in p_norm:
        profile_key = "high_altitude_isr"
    elif "hot" in p_norm or "weather" in p_norm:
        profile_key = "hot_weather"
    elif "rapid" in p_norm or "transition" in p_norm or "agility" in p_norm:
        profile_key = "rapid_throttle_transitions"
    elif "endurance" in p_norm or "6-hour" in p_norm or "6 hour" in p_norm or "loiter" in p_norm:
        profile_key = "long_endurance"

    prof = MISSION_PROFILES[profile_key]
    telem = target_engine.get("telemetry", {})
    health = float(target_engine.get("health", 90))
    rul = float(target_engine.get("rul", 100))
    cht = float(telem.get("cht", 175))
    vib = float(telem.get("vibration", 2.0))
    fuel_flow = float(telem.get("fuelFlow", 32.0))

    # Evaluate readiness criteria
    risk_factors: List[str] = []
    projected_thermal_margin = round(prof["max_cht_limit"] - cht, 1)
    projected_vibration_margin = round(prof["max_vibration_limit"] - vib, 2)
    rul_safety_margin_hours = round(rul - prof["target_duration_hours"], 1)

    if health < prof["required_health_min"]:
        risk_factors.append(f"Engine health ({health}%) below required threshold ({prof['required_health_min']}%)")

    if rul_safety_margin_hours < 5.0:
        risk_factors.append(f"RUL margin critically tight ({rul} hrs vs {prof['target_duration_hours']} hr mission)")

    if projected_thermal_margin < 0:
        risk_factors.append(f"CHT exceeds mission thermal ceiling by {abs(projected_thermal_margin)}°C")
    elif projected_thermal_margin < 12.0:
        risk_factors.append(f"Marginal CHT buffer ({projected_thermal_margin}°C remaining to limit)")

    if projected_vibration_margin < 0:
        risk_factors.append(f"Vibration level ({vib} mm/s) exceeds profile allowance ({prof['max_vibration_limit']} mm/s)")

    # Projected fuel consumption
    projected_fuel_burn_liters = round(fuel_flow * prof["target_duration_hours"], 1)

    # Classification
    if len(risk_factors) == 0 and health >= 85 and rul >= 50:
        readiness_class = "NOMINAL"
        recommendation = "Full mission clearance recommended under standard cruise parameters."
        envelope_status = "FLIGHT ENVELOPE: OPTIMAL // MISSION READY"
    elif rul > prof["target_duration_hours"] and health >= 65 and len(risk_factors) <= 2:
        readiness_class = "CONDITIONAL"
        recommendation = (
            f"Conditional clearance granted with restricted continuous manifold pressure (derate 6%). "
            f"Monitor CHT and vibration closely."
        )
        envelope_status = "FLIGHT ENVELOPE: CONDITIONAL (Derated Loiter)"
    elif rul < prof["target_duration_hours"] * 1.5 or health < 55 or vib > 4.0:
        readiness_class = "NOT RECOMMENDED"
        recommendation = (
            f"Mission sortie NOT RECOMMENDED for {target_engine.get('id')}. High probability of component threshold breach."
        )
        envelope_status = "FLIGHT ENVELOPE: RESTRICTED // ABORT SORTIE"
    else:
        readiness_class = "REVIEW REQUIRED"
        recommendation = "Engineering pre-flight inspection and dynamic run-up check required prior to release."
        envelope_status = "FLIGHT ENVELOPE: REVIEW REQUIRED"

    return {
        "engine_id": target_engine.get("id"),
        "mission_profile": prof["name"],
        "target_duration_hours": prof["target_duration_hours"],
        "readiness_classification": readiness_class,
        "envelope_status": envelope_status,
        "recommendation": recommendation,
        "risk_factors": risk_factors,
        "projected_metrics": {
            "projected_fuel_burn_l": projected_fuel_burn_liters,
            "thermal_headroom_c": projected_thermal_margin,
            "vibration_headroom_mm_s": projected_vibration_margin,
            "remaining_rul_post_mission_hrs": max(0.0, rul_safety_margin_hours),
        },
        "advisory_disclaimer": "Advisory simulation for tactical planning. Not autonomous flight clearance.",
        "data_mode": "DEMO SIMULATION",
    }
