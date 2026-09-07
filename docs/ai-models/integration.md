# DHRUVA ML integration contract (Niranjan)

Prototype / demo only. Not certified aviation software. Health and RUL
bands are demonstration thresholds, not operational limits. No DRDO or
classified engine data is used.

## Backend call

```python
from ml.inference.inference_service import run_inference

result = run_inference(telemetry)
```

`telemetry` may be:

- a single `dict`
- a `list` of dicts (window)
- a `pandas.DataFrame`

Field names should follow the canonical schema (aliases such as `CHT`,
`oil_temp`, `ambient_temp` are accepted).

If Digital Twin residuals or `health_index` / `digital_twin_state` are
present, ML consumes them. It does not recompute physics.

## Result shape

```json
{
  "engine_id": "ENG001",
  "timestamp": "...",
  "health_index": 67.0,
  "status": "WARNING",
  "anomaly": {"detected": true, "score": 0.87, "severity": "high"},
  "fault": {"type": "cooling_degradation", "confidence": 0.91},
  "rul": {"hours": 31.0, "uncertainty_hours": 5.0},
  "sensor_drift": {"detected": false, "sensor": null, "severity": null},
  "digital_twin_state": {},
  "explanation": {"top_factors": []}
}
```

The dict is JSON-serializable. Extra keys (`trends`, disclaimer) may be
present; the keys above are stable.

## Train models

From the repo root:

```text
pip install -r ml/requirements.txt
python -m ml.train_all
```

If `data/synthetic/**/*.csv` or `data/processed/**/*.csv` exist, they are
used. Otherwise compact ML fixtures are used so this branch can train
without the production generator.

## Demo

```text
python -m ml.run_demo
```

## Tests

```text
pytest tests/ml -q
```
