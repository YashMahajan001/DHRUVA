"""
DHRUVA Tool 4: Remaining Useful Life (RUL) & Prognostic Analytics
Provides prototype analytical RUL estimation based on multi-parameter degradation physics.
"""

from typing import Dict, Any, List


def estimate_rul(engine_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Estimates Remaining Useful Life (RUL) using prototype analytical degradation models.
    Clearly labeled as DEMO ESTIMATE.
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
            "message": f"Engine {engine_id} not found.",
            "data_mode": "DEMO ESTIMATE",
        }

    telem = target_engine.get("telemetry", {})
    health = float(target_engine.get("health", 90))
    existing_rul = float(target_engine.get("rul", 150))

    # Analytical degradation stress factors
    vib = float(telem.get("vibration", 2.0))
    cht = float(telem.get("cht", 175))
    oil_press = float(telem.get("oilPressure", 80))

    # Stress coefficients (prototype physical heuristics)
    vib_stress = max(1.0, (vib / 2.0) ** 2.2)
    thermal_stress = max(1.0, ((cht - 140) / 35.0) ** 1.8) if cht > 175 else 1.0
    lube_stress = max(1.0, (80.0 / max(oil_press, 20.0)) ** 1.5) if oil_press < 75 else 1.0

    composite_stress_index = round((0.45 * vib_stress) + (0.35 * thermal_stress) + (0.20 * lube_stress), 2)

    # Estimate RUL flight hours based on current health and stress
    # Baseline nominal max TBO (Time Between Overhaul) is 2000 hours, operational loiter cycle ~250 hrs
    estimated_rul_hours = round(min(existing_rul, max(4.0, (health / 100.0) * (250.0 / composite_stress_index))), 1)

    # Degradation rate (operating hours lost per flight hour)
    accelerated_wear_rate = round(composite_stress_index, 2)

    # Bottleneck component identification
    if vib > 4.0:
        bottleneck = "Crankshaft Journal & Main Bearing Hub (Vibration Fatigue)"
        urgency = "IMMEDIATE (Ground abort / pre-flight mandatory overhaul)"
    elif cht > 210:
        bottleneck = "Cylinder #3 Exhaust Valve & Baffle Airflow Matrix"
        urgency = "HIGH (Borescope inspection required within 15 flight hours)"
    elif oil_press < 60:
        bottleneck = "Oil Scavenge Pump & Filter Pressure Drop"
        urgency = "MEDIUM (Oil change & filter screen check)"
    else:
        bottleneck = "Nominal Component Wear Cycle (Standard Maintenance Interval)"
        urgency = "ROUTINE"

    # Fleet-wide RUL ranking
    fleet_ruls = [
        {
            "engine_id": e.get("id"),
            "health": e.get("health"),
            "rul_hours": e.get("rul"),
        }
        for e in engines
    ]
    fleet_ruls.sort(key=lambda x: x["rul_hours"])

    return {
        "engine_id": target_engine.get("id"),
        "engine_name": target_engine.get("name"),
        "estimated_rul_hours": estimated_rul_hours,
        "model_type": "PROTOTYPE ANALYTICAL ESTIMATOR",
        "data_mode": "DEMO ESTIMATE",
        "composite_stress_index": composite_stress_index,
        "accelerated_wear_rate": f"{accelerated_wear_rate}x nominal baseline",
        "limiting_subsystem": bottleneck,
        "maintenance_urgency": urgency,
        "fleet_rul_ranking": fleet_ruls,
        "disclaimer": "Advisory prototype estimation. Not certified engineering RUL.",
    }
