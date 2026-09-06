# Phase 2: Digital Twin + Health Intelligence

This is a representative prototype using synthetic telemetry and simplified physics relationships. It does not represent classified, proprietary, certified, or operational DRDO engine data or aircraft safety limits. Health bands are demonstration thresholds only.

## Architecture

Phase 1 telemetry is consumed sequentially by `DigitalTwin`:

```
telemetry sample
    → Phase 1 physics expected values (`compute_healthy_step`)
    → residual = actual − expected
    → data/physics validity flags (separate from scoring)
    → component health + EMA smoothing
    → Health Index 0–100
    → TwinState
```

Reusable Phase 1 pieces: telemetry schema, engine models, `compute_healthy_step`, generators, configs.

## Expected vs actual

Operating conditions from the sample (`throttle`, `altitude`, `ambient_temp`) drive the physics replica. The twin keeps its own lagged RPM / oil-temp state so expected sensors are not copies of measured sensors.

`residual = actual - expected`  
`norm_residual = residual / configurable_scale`

Channels: RPM, CHT, EGT, oil pressure/temp, fuel flow, vibration, battery voltage, alternator current.

## Component health

Exponential scores from `|norm_residual|` for:

- thermal (CHT, EGT, oil temp)
- lubrication (oil pressure, oil temp)
- mechanical (vibration)
- combustion (fuel flow, RPM)
- electrical (battery, alternator)
- sensor / data quality (residuals + `data_quality` / dropouts)

## Health Index

Weighted combination of components, blended toward the worst component, then EMA-smoothed. Optional ML payload can lower the index; it is never generated here.

States (demo only): 90–100 NORMAL, 70–89 WATCH, 40–69 WARNING, 0–39 CRITICAL.

## ML integration

```python
from digital_twin import DigitalTwin, MLResult

twin = DigitalTwin("O320_CLASS")
state = twin.update(record)  # physics only
state = twin.update(record, ml_result=MLResult(anomaly_probability=0.4, confidence=0.8))
states = twin.process_dataframe(df)
```

`MLResult` fields: `anomaly_probability`, `degradation_estimate`, `fault_class`, `rul`, `confidence`.

## Limitations

- Not a certified engine or safety system
- Residual scales and weights are tunable demo values
- No ML training, RUL model, API, or UI in this phase
