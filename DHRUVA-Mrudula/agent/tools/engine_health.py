"""
DHRUVA Tool 1: Engine Health Analytics
Performs deterministic multi-subsystem health evaluation and prototype anomaly scoring.
"""

from typing import Dict, Any, List


# Prototype Analytical Baselines for Lycoming O-320 Class Aero-Piston Engines
PROTOTYPE_BASELINES = {
    "rpm": {"nominal": 2450.0, "tolerance": 150.0, "weight": 0.10},
    "cht": {"nominal": 175.0, "tolerance": 25.0, "weight": 0.25},
    "egt": {"nominal": 690.0, "tolerance": 45.0, "weight": 0.15},
    "oilPressure": {"nominal": 80.0, "tolerance": 15.0, "weight": 0.20},
    "oilTemperature": {"nominal": 85.0, "tolerance": 15.0, "weight": 0.10},
    "fuelFlow": {"nominal": 32.0, "tolerance": 4.0, "weight": 0.10},
    "vibration": {"nominal": 2.0, "tolerance": 1.0, "weight": 0.20},
}


def get_engine_health(engine_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Evaluates engine health using deterministic multi-parameter deviations
    and calculates prototype anomaly scores.
    """
    engines = data.get("engines", [])
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
            "message": f"Engine {engine_id} not found in telemetry context.",
            "data_mode": "DEMO ANALYTICS",
        }

    telem = target_engine.get("telemetry", {})
    subsystems = target_engine.get("twinState", {}).get("subsystems", {})
    reported_health = target_engine.get("health", 100)

    # Compute normalized parameter deviations vs prototype baseline
    deviations: Dict[str, Dict[str, Any]] = {}
    weighted_anomaly_sum = 0.0
    total_weight = 0.0

    for param, config in PROTOTYPE_BASELINES.items():
        val = float(telem.get(param, config["nominal"]))
        nom = config["nominal"]
        tol = config["tolerance"]
        weight = config["weight"]

        raw_dev = val - nom
        pct_dev = (raw_dev / nom) * 100.0 if nom != 0 else 0.0
        normalized_z = abs(raw_dev) / tol

        deviations[param] = {
            "measured": round(val, 2),
            "nominal_baseline": nom,
            "delta_pct": round(pct_dev, 2),
            "normalized_deviation": round(normalized_z, 3),
        }

        weighted_anomaly_sum += normalized_z * weight
        total_weight += weight

    composite_anomaly_score = round(weighted_anomaly_sum / max(total_weight, 0.01), 3)

    # Detect specific subsystem degradation modes
    anomaly_flags: List[str] = []
    if telem.get("cht", 0) > 200 or deviations.get("cht", {}).get("delta_pct", 0) > 15:
        anomaly_flags.append("Thermal Stress (Elevated Cylinder Head Temperature)")

    if telem.get("egt", 0) > 730:
        anomaly_flags.append("Combustion Instability (High Exhaust Gas Temperature)")

    if telem.get("oilPressure", 80) < 65 or telem.get("oilTemperature", 85) > 95:
        anomaly_flags.append("Lubrication Concern (Oil Pressure Drop / High Thermal Load)")

    if telem.get("vibration", 0) > 3.0:
        anomaly_flags.append("Vibration Anomaly (Rotational Bearing / Structural Harmonic)")

    if subsystems.get("coolingAirflow", 100) < 70:
        anomaly_flags.append("Cooling Airflow Degradation (Baffle Pressure Loss)")

    if subsystems.get("lubricationSump", 100) < 60:
        anomaly_flags.append("Sump Scavenge Imbalance")

    # Determine health classification
    if reported_health >= 85 and composite_anomaly_score < 1.0:
        health_status = "OPTIMAL"
    elif reported_health >= 65 or composite_anomaly_score < 1.8:
        health_status = "DEGRADED // WATCH"
    else:
        health_status = "CRITICAL // ATTENTION REQUIRED"

    return {
        "engine_id": target_engine.get("id"),
        "engine_name": target_engine.get("name"),
        "reported_health_pct": reported_health,
        "health_status": health_status,
        "composite_anomaly_score": composite_anomaly_score,
        "anomaly_flags": anomaly_flags,
        "subsystem_health": subsystems,
        "parameter_deviations": deviations,
        "data_mode": "DEMO ANALYTICS",
        "baseline_standard": "DHRUVA PROTOTYPE ANALYTICAL BASELINE",
    }
