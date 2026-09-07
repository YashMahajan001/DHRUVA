"""
DHRUVA Tool 2: Telemetry & Dynamic Signal Analysis
Handles multi-channel sensor ingestion, throttle-response metrics,
and complex phasor vibration diagnostics.
"""

import math
import cmath
from typing import Dict, Any, List


def get_telemetry(engine_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extracts telemetry parameters, computes derived throttle response metrics,
    and applies complex-number phasor transformation to vibration harmonics.
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
            "message": f"Telemetry for {engine_id} not available.",
            "data_mode": "DEMO ANALYTICS",
        }

    telem = target_engine.get("telemetry", {})
    history: List[Dict[str, Any]] = data.get("telemetry_history", [])

    # Current telemetry values
    rpm = float(telem.get("rpm", 2450))
    cht = float(telem.get("cht", 175))
    egt = float(telem.get("egt", 690))
    oil_press = float(telem.get("oilPressure", 80))
    oil_temp = float(telem.get("oilTemperature", 85))
    fuel_flow = float(telem.get("fuelFlow", 32.0))
    vibration = float(telem.get("vibration", 2.0))
    manifold_p = float(telem.get("manifoldPressure", 24.8))
    harmonic_freq = float(telem.get("harmonicFreq", 124.8))
    cyl_temps = telem.get("cylinderTemps", [cht, cht, cht, cht])

    # 1. THROTTLE RESPONSE ANALYSIS (Derived Analytical Metric)
    # Evaluates transient response rate, lag, and governor tracking stability
    # Baseline Lycoming O-320 nominal step latency is 420 ms.
    base_latency_ms = 420.0
    # Modulate simulated latency by oil viscosity/temp, health, and manifold delta
    health_factor = (100.0 - float(target_engine.get("health", 90))) / 100.0
    vibration_factor = max(0.0, (vibration - 2.0) * 45.0)
    thermal_drag = max(0.0, (oil_temp - 85.0) * 3.5)

    derived_throttle_latency_ms = round(base_latency_ms + (health_factor * 180.0) + vibration_factor + thermal_drag, 1)
    response_bandwidth_hz = round(1000.0 / (derived_throttle_latency_ms * 2.0 * math.pi), 2)
    slew_rate_pct_sec = round(max(35.0, 95.0 - (health_factor * 40.0) - (vibration * 3.0)), 1)

    if derived_throttle_latency_ms <= 460:
        throttle_assessment = "NORMAL // CRISP TRANSIENT RESPONSE"
    elif derived_throttle_latency_ms <= 580:
        throttle_assessment = "DEGRADED // MINOR GOVERNOR LAG (+15-30% latency)"
    else:
        throttle_assessment = "SLUGGISH // ELEVATED POWER-STEP LATENCY (Review Recommended)"

    # 2. VIBRATION COMPLEX-NUMBER PHASOR ANALYSIS
    # z = A * exp(i * theta) = A*(cos(theta) + i*sin(theta))
    # A = vibration RMS amplitude (mm/s), theta = derived phase angle relative to shaft TDC
    # In demo mode, theta is derived from harmonic frequency ratio and engine index.
    eng_index = target_engine.get("index", 0)
    derived_phase_deg = round((((harmonic_freq * 17.3) + (eng_index * 90.0)) % 360.0) - 180.0, 1)
    derived_phase_rad = math.radians(derived_phase_deg)

    # Complex phasor representation
    phasor_z = cmath.rect(vibration, derived_phase_rad)
    real_component = round(phasor_z.real, 3)
    imag_component = round(phasor_z.imag, 3)
    phasor_magnitude = round(abs(phasor_z), 3)

    # Historical trend summary if available
    historical_summary = {}
    if history:
        sample_count = len(history)
        avg_rpm = sum(h.get("rpm", rpm) for h in history) / sample_count
        avg_cht = sum(h.get("cht", cht) for h in history) / sample_count
        avg_vib = sum(h.get("vibration", vibration) for h in history) / sample_count
        historical_summary = {
            "samples_analyzed": sample_count,
            "avg_rpm": round(avg_rpm, 1),
            "avg_cht": round(avg_cht, 1),
            "avg_vibration": round(avg_vib, 2),
            "cht_trend": "RISING" if cht > avg_cht + 1.0 else ("FALLING" if cht < avg_cht - 1.0 else "STABLE"),
        }

    return {
        "engine_id": target_engine.get("id"),
        "raw_telemetry": {
            "rpm": rpm,
            "cht": cht,
            "egt": egt,
            "oil_pressure": oil_press,
            "oil_temperature": oil_temp,
            "fuel_flow": fuel_flow,
            "vibration": vibration,
            "manifold_pressure": manifold_p,
            "harmonic_frequency_hz": harmonic_freq,
            "cylinder_temperatures": cyl_temps,
        },
        "throttle_response": {
            "metric_type": "DERIVED / DEMO ANALYTIC",
            "step_latency_ms": derived_throttle_latency_ms,
            "nominal_latency_ms": base_latency_ms,
            "latency_deviation_pct": round(((derived_throttle_latency_ms - base_latency_ms) / base_latency_ms) * 100, 1),
            "power_slew_rate_pct_sec": slew_rate_pct_sec,
            "response_bandwidth_hz": response_bandwidth_hz,
            "assessment": throttle_assessment,
        },
        "vibration_phasor": {
            "metric_type": "DERIVED COMPLEX PHASOR ANALYTIC",
            "magnitude_mm_s": phasor_magnitude,
            "phase_deg": derived_phase_deg,
            "real_in_phase_mm_s": real_component,
            "imag_quadrature_mm_s": imag_component,
            "harmonic_band_hz": harmonic_freq,
            "interpretation": (
                "Phasor magnitude elevated; asymmetric radial unbalance detected"
                if vibration > 3.0
                else "Phasor within nominal vibrational envelope"
            ),
        },
        "history_trend": historical_summary,
        "data_mode": "DEMO ANALYTICS",
    }
