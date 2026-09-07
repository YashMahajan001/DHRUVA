# Phase 1: Synthetic Data + Engine/Mission Simulation Foundation

This is a representative synthetic simulation for prototype and demonstration purposes. It does not represent classified, proprietary, certified, or operational DRDO engine data or aircraft safety limits.

## What Phase 1 does

Phase 1 produces labelled, reproducible engine telemetry for later Digital Twin and ML work. It generates:

- Healthy, mission-dependent, environment-dependent telemetry
- Fault-injected telemetry (gradual and sudden)
- CSV and JSON datasets with a canonical schema

It does **not** train ML models, expose APIs, persist to a database, or compute RUL.

## Architecture

Separated modules (existing repo folders preserved; there is no nested `twin/` package because the repo already uses `digital_twin/` and `simulation/`):

| Concern | Location |
| --- | --- |
| Telemetry schema | `data/schemas/` |
| Engine models | `digital_twin/engines/` + `configs/engines/` |
| Physics relationships | `digital_twin/physics/` |
| Mission profiles | `simulation/missions/` + `configs/missions/` |
| Sensor noise | `data/generators/noise.py` |
| Fault injection | `data/faults/` |
| Generator / export / validation | `data/generators/` |
| Public API | `simulation/engine_simulator.py` → `generate_telemetry()` |
| Demo | `generate_demo.py` |

Pipeline:

```
Engine model + mission profile + environment
    → physics-inspired healthy telemetry
    → optional fault injection
    → validation
    → CSV / JSON
```

## Telemetry schema

Canonical columns (fixed order):

`timestamp, engine_id, model_id, mission_id, altitude, ambient_temp, rpm, throttle, cht, egt, oil_pressure, oil_temp, fuel_flow, vibration_rms, battery_voltage, alternator_current, injection_timing, mission_phase, fault_label, fault_active, fault_severity, data_quality, sensor_status, simulation_seed, health_index, rul, cht_residual, egt_residual, oil_pressure_residual, fuel_flow_residual, rpm_residual, vibration_rms_residual`

Healthy rows use `fault_label=HEALTHY`. Faulty rows use the fault type name (joined with `+` if multiple faults are active).

## Engine models

Representative classes only (configurable coefficients, not certified maps):

- `O320_CLASS` (~100 HP class)
- `ROTAX914_CLASS` (~115 HP class)
- `AE300_CLASS` (~170 HP class)

Load with `get_engine_model("O320_CLASS")`.

## Mission profiles

- `HIGH_ALTITUDE_ISR`
- `LONG_ENDURANCE_LOITER`
- `RAPID_RESPONSE`
- `HOT_WEATHER`
- `MARITIME_PATROL`
- `CUSTOM`

Phases: `TAKEOFF`, `CLIMB`, `CRUISE`, `LOITER` (optional), `DESCENT`, `LANDING`.

These are representative simulations, not operational UAV mission profiles.

## Physics-inspired relationships

Documented in `digital_twin/physics/`:

- `rpm = lag(idle + throttle * (max-idle) * altitude_power_factor)`
- `load = throttle * (rpm/nominal) / altitude_power_factor`
- `fuel_flow = idle + gain * load * efficiency * power * altitude_enrichment`
- `cht = ambient + (cht_gain * thermal * load) / cooling(altitude, ambient)`
- `egt = ambient + egt_base + egt_gain * load + k * excess_fuel`
- `oil_temp` first-order lag toward `ambient + offset + oil_thermal * load`
- `oil_pressure = (idle + gain * rpm_norm) * oil_factor * viscosity_factor`
- `vibration = base + factor * (k1 * rpm_norm² + k2 * load)`
- electrical output and injection timing from rpm and load

Higher altitude lowers density ratio (power and cooling). Higher ambient temperature reduces cooling effectiveness and raises thermal channels.

Sensor noise is per-channel Gaussian, configured on each engine.

## Fault injection

Types: `INJECTOR_DEGRADATION`, `COMBUSTION_DISTURBANCE`, `COOLING_DEGRADATION`, `LUBRICATION_PRESSURE_LOSS`, `OVERHEATING`, `ABNORMAL_VIBRATION`, `ALTERNATOR_DEGRADATION`, `BATTERY_DEGRADATION`, `SENSOR_BIAS`, `SENSOR_DRIFT`, `SENSOR_DROPOUT`.

Each fault only perturbs related channels. Configure `start`, `duration`, `severity` (0-1), `progression` (`gradual`|`sudden`), and `affected_sensor` for sensor faults. Multiple faults are supported; single-fault is the default.

## Configuration

JSON under `configs/`:

- `configs/engines/`
- `configs/missions/`
- `configs/faults/`
- `configs/simulation/default.json`

## How to generate data

```python
from simulation import generate_telemetry

df = generate_telemetry(
    engine_model="O320_CLASS",
    mission_profile="HIGH_ALTITUDE_ISR",
    duration=3600,
    sampling_rate=1,
    seed=42,
)

df_fault = generate_telemetry(
    engine_model="AE300_CLASS",
    mission_profile="LONG_ENDURANCE_LOITER",
    duration=3600,
    sampling_rate=1,
    seed=42,
    faults=[{"type": "COOLING_DEGRADATION", "start": 300, "duration": 600, "severity": 0.7, "progression": "gradual"}],
)
```

CLI:

```bash
python data/generate_dataset.py --engine O320_CLASS --mission HIGH_ALTITUDE_ISR --duration 120 --stem demo
python generate_demo.py
```

Outputs go to `data/synthetic/healthy|faults|missions/`. Large generated files are gitignored; a short sample is written by the demo.

## How to run tests

```bash
pip install -r requirements.txt
pytest
```

## Example outputs

`generate_demo.py` writes:

- `data/synthetic/healthy/healthy_o320_high_altitude.csv`
- `data/synthetic/faults/cooling_degradation_o320.csv`
- `data/synthetic/faults/sensor_drift_ae300.csv`
- `data/synthetic/faults/abnormal_vibration_o320.csv`
- `data/synthetic/missions/sample_cooling_o320_60s.csv` (short sample)

Polished demo: O320 + HIGH_ALTITUDE_ISR + 1800 s + cooling degradation from t=900 s. CHT/EGT rise after onset; unrelated channels stay comparatively stable.

## Limitations

- Simplified algebraic relationships, not a thermodynamic cycle or FADEC model
- Coefficients are tunable representatives, not measured engine maps
- Noise is Gaussian, not a full sensor-error model
- No streaming, database, ML, RUL, or UI in this phase
- Integrity bounds are data-quality checks, not aircraft limits

## What Phase 2 / other teams consume

ML (Niranjan): CSV/JSON with `fault_label`, `fault_severity`, `fault_active`, ordered timestamps, and correlated channels.

Digital Twin Phase 2: `DigitalTwin.update` / `process_dataframe` using `compute_healthy_step` residuals. See [phase2.md](phase2.md).

Backend / frontend later: files under `data/synthetic/` and the `generate_telemetry()` API.
