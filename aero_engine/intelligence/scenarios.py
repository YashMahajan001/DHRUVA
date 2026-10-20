"""Preconfigured Flight Envelope Scenarios for Dhruva Aero.

Defines realistic aerospace operational regimes, duration, atmospheric conditions,
and fault injection timelines for simulation experiments.
"""

from __future__ import annotations

from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field


class AeroScenarioStep(BaseModel):
    """Specific phase waypoint in a flight scenario."""
    time_offset_s: float
    throttle: float = Field(..., ge=0.0, le=1.0)
    altitude_m: float = Field(0.0, ge=0.0, le=20000.0)
    mach: float = Field(0.0, ge=0.0, le=2.5)
    ambient_temp_c: float = Field(15.0, ge=-70.0, le=60.0)
    injected_fault: Optional[str] = None
    phase_label: str = "STEADY"


class AeroFlightScenario(BaseModel):
    """Complete flight profile and mission scenario configuration."""
    scenario_id: str
    title: str
    description: str
    duration_s: float
    initial_altitude_m: float
    initial_throttle: float
    waypoints: List[AeroScenarioStep]


AERO_PRECONFIGURED_SCENARIOS: Dict[str, AeroFlightScenario] = {
    "SCEN-AERO-TAKEOFF": AeroFlightScenario(
        scenario_id="SCEN-AERO-TAKEOFF",
        title="Maximum Takeoff Thrust (TOGA) & Initial Rotation",
        description="Full power sea-level takeoff roll, brake release, acceleration to V2 rotation speed, and initial climb.",
        duration_s=60.0,
        initial_altitude_m=0.0,
        initial_throttle=1.0,
        waypoints=[
            AeroScenarioStep(time_offset_s=0.0, throttle=0.40, altitude_m=0.0, mach=0.0, ambient_temp_c=25.0, phase_label="Lineup & Spool-up"),
            AeroScenarioStep(time_offset_s=5.0, throttle=1.00, altitude_m=0.0, mach=0.10, ambient_temp_c=25.0, phase_label="Takeoff Roll"),
            AeroScenarioStep(time_offset_s=25.0, throttle=1.00, altitude_m=150.0, mach=0.25, ambient_temp_c=24.0, phase_label="Rotation V2"),
            AeroScenarioStep(time_offset_s=50.0, throttle=0.92, altitude_m=600.0, mach=0.35, ambient_temp_c=21.0, phase_label="Climb Thrust Cutback"),
        ],
    ),
    "SCEN-AERO-CLIMB": AeroFlightScenario(
        scenario_id="SCEN-AERO-CLIMB",
        title="Continuous High-Power En-Route Climb",
        description="Standard climb profile through lapse layers to transition flight level.",
        duration_s=90.0,
        initial_altitude_m=1000.0,
        initial_throttle=0.88,
        waypoints=[
            AeroScenarioStep(time_offset_s=0.0, throttle=0.88, altitude_m=1000.0, mach=0.45, ambient_temp_c=8.0, phase_label="Passing FL050"),
            AeroScenarioStep(time_offset_s=30.0, throttle=0.88, altitude_m=4000.0, mach=0.60, ambient_temp_c=-11.0, phase_label="Climbing through FL130"),
            AeroScenarioStep(time_offset_s=60.0, throttle=0.85, altitude_m=8000.0, mach=0.74, ambient_temp_c=-37.0, phase_label="Tropopause Approach"),
            AeroScenarioStep(time_offset_s=90.0, throttle=0.82, altitude_m=10600.0, mach=0.78, ambient_temp_c=-54.0, phase_label="Level-off FL350"),
        ],
    ),
    "SCEN-AERO-CRUISE": AeroFlightScenario(
        scenario_id="SCEN-AERO-CRUISE",
        title="Standard Long-Range High-Altitude Cruise",
        description="Steady-state cruise at FL350 Mach 0.80 under standard atmospheric conditions.",
        duration_s=120.0,
        initial_altitude_m=10668.0,  # 35,000 ft
        initial_throttle=0.78,
        waypoints=[
            AeroScenarioStep(time_offset_s=0.0, throttle=0.78, altitude_m=10668.0, mach=0.80, ambient_temp_c=-54.0, phase_label="Steady Cruise"),
            AeroScenarioStep(time_offset_s=60.0, throttle=0.78, altitude_m=10668.0, mach=0.80, ambient_temp_c=-54.0, phase_label="Mid-Cruise Point"),
            AeroScenarioStep(time_offset_s=120.0, throttle=0.78, altitude_m=10668.0, mach=0.80, ambient_temp_c=-54.0, phase_label="Top of Descent"),
        ],
    ),
    "SCEN-AERO-DESCENT": AeroFlightScenario(
        scenario_id="SCEN-AERO-DESCENT",
        title="Flight Idle Descent Profile",
        description="Throttles retarded to flight idle for economic profile descent into terminal arrival area.",
        duration_s=60.0,
        initial_altitude_m=9000.0,
        initial_throttle=0.25,
        waypoints=[
            AeroScenarioStep(time_offset_s=0.0, throttle=0.25, altitude_m=9000.0, mach=0.72, ambient_temp_c=-45.0, phase_label="Descent Ingress"),
            AeroScenarioStep(time_offset_s=30.0, throttle=0.25, altitude_m=5000.0, mach=0.55, ambient_temp_c=-17.0, phase_label="Intermediate Descent"),
            AeroScenarioStep(time_offset_s=60.0, throttle=0.45, altitude_m=1500.0, mach=0.35, ambient_temp_c=5.0, phase_label="Approach Capture"),
        ],
    ),
    "SCEN-AERO-COMP-STALL": AeroFlightScenario(
        scenario_id="SCEN-AERO-COMP-STALL",
        title="High-Power Compressor Stall Injection",
        description="Takeoff power climb with injected high-pressure compressor stall at t=15s to evaluate recovery response.",
        duration_s=45.0,
        initial_altitude_m=500.0,
        initial_throttle=0.95,
        waypoints=[
            AeroScenarioStep(time_offset_s=0.0, throttle=0.95, altitude_m=500.0, mach=0.30, ambient_temp_c=20.0, phase_label="Nominal Climb"),
            AeroScenarioStep(time_offset_s=15.0, throttle=0.95, altitude_m=800.0, mach=0.32, ambient_temp_c=18.0, injected_fault="FAULT-COMPRESSOR-STALL", phase_label="Injected Compressor Stall"),
            AeroScenarioStep(time_offset_s=25.0, throttle=0.30, altitude_m=950.0, mach=0.28, ambient_temp_c=17.0, phase_label="Pilot Throttle Chop to Idle"),
            AeroScenarioStep(time_offset_s=40.0, throttle=0.55, altitude_m=900.0, mach=0.26, ambient_temp_c=17.0, phase_label="Slow Relight / Recovery"),
        ],
    ),
    "SCEN-AERO-OIL-LEAK": AeroFlightScenario(
        scenario_id="SCEN-AERO-OIL-LEAK",
        title="In-Flight Lubrication Pressure Degradation",
        description="Cruise flight at FL280 with progressive oil pressure loss starting at t=20s to test FADEC alarm detection.",
        duration_s=60.0,
        initial_altitude_m=8500.0,
        initial_throttle=0.78,
        waypoints=[
            AeroScenarioStep(time_offset_s=0.0, throttle=0.78, altitude_m=8500.0, mach=0.76, ambient_temp_c=-40.0, phase_label="Cruise FL280"),
            AeroScenarioStep(time_offset_s=20.0, throttle=0.78, altitude_m=8500.0, mach=0.76, ambient_temp_c=-40.0, injected_fault="FAULT-OIL-LOSS", phase_label="Bearing Sump Seal Breach"),
            AeroScenarioStep(time_offset_s=45.0, throttle=0.70, altitude_m=8500.0, mach=0.72, ambient_temp_c=-40.0, phase_label="FADEC Advisory Warning"),
            AeroScenarioStep(time_offset_s=60.0, throttle=0.50, altitude_m=7500.0, mach=0.60, ambient_temp_c=-34.0, phase_label="Precautionary Drift-down"),
        ],
    ),
}
