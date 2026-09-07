"""
Engine configuration presets for MALE UAV aero piston engines.

Each config dict defines nominal operating ranges used by EngineSimulator.
Since the canonical telemetry schema currently only tracks rpm and a single
'temperature' field, configs differ primarily in rpm ceilings and target
temperature ranges.

All units: rpm (rev/min), temperature (deg C), oil_pressure (psi),
fuel_flow (L/h).
"""

# ── Lycoming O-320 — naturally aspirated, ~100 HP baseline ────────
O320_CLASS: dict = {
    "name": "Lycoming O-320",
    "max_hp": 100,
    "max_rpm": 2700,
    "idle_rpm": 600,
    # Temperature (single-value proxy for CHT in current schema)
    "temp_target_idle": 65.0,        # deg C at idle, sea-level
    "temp_target_max_power": 105.0,  # deg C at WOT sea-level
    "temp_tau": 15.0,                # first-order lag time constant (s)
    # Oil pressure
    "oil_pressure_idle": 25.0,       # psi
    "oil_pressure_max": 60.0,        # psi
    # Fuel flow
    "fuel_flow_idle": 8.0,           # L/h
    "fuel_flow_max": 38.0,           # L/h
    # Sensor noise std-dev per channel
    "noise": {
        "rpm": 5.0,
        "temperature": 0.4,
        "oil_pressure": 0.3,
        "fuel_flow": 0.2,
    },
}

# ── Rotax 914 — turbocharged, ~115 HP ─────────────────────────────
ROTAX914_CLASS: dict = {
    "name": "Rotax 914",
    "max_hp": 115,
    "max_rpm": 5800,
    "idle_rpm": 1400,
    "temp_target_idle": 55.0,
    "temp_target_max_power": 110.0,
    "temp_tau": 12.0,
    "oil_pressure_idle": 22.0,
    "oil_pressure_max": 58.0,
    "fuel_flow_idle": 6.0,
    "fuel_flow_max": 30.0,
    "noise": {
        "rpm": 8.0,
        "temperature": 0.35,
        "oil_pressure": 0.3,
        "fuel_flow": 0.15,
    },
}

# ── Austro Engine AE300 — diesel, ~170 HP ─────────────────────────
AE300_CLASS: dict = {
    "name": "Austro Engine AE300",
    "max_hp": 170,
    "max_rpm": 2300,
    "idle_rpm": 900,
    "temp_target_idle": 70.0,
    "temp_target_max_power": 120.0,
    "temp_tau": 18.0,
    "oil_pressure_idle": 28.0,
    "oil_pressure_max": 65.0,
    "fuel_flow_idle": 5.0,
    "fuel_flow_max": 42.0,
    "noise": {
        "rpm": 4.0,
        "temperature": 0.5,
        "oil_pressure": 0.35,
        "fuel_flow": 0.25,
    },
}
