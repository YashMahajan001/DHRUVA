# DHRUVA — MACHINE LEARNING IMPROVEMENT LOG

**Date**: October 2026  
**Status**: COMPLETE  
**Automated Tests**: 181 passing (0 failing)  

---

## 1. Summary of Changes

| File Modified / Created | Nature of Change | Design Decision & Rationale |
| :--- | :--- | :--- |
| [`ml/data_processing/cleaning.py`](file:///c:/Users/niran/OneDrive/Desktop/DHRUVA/ml/data_processing/cleaning.py) | **Hardening** | Added `_detect_frozen_sensors()` to catch stuck sensor signals ($\text{std} < 10^{-6}$ over $\ge 5$ samples). Sets `sensor_status = "FROZEN_SENSOR"` and marks `data_valid = False` to distinguish sensor failure from mechanical engine fault. |
| [`backend/app/services/health_service.py`](file:///c:/Users/niran/OneDrive/Desktop/DHRUVA/backend/app/services/health_service.py) | **Constraint Precedence** | Added **Constraint-Aware Health Precedence**: If a critical physical safety envelope rule is breached (over-temperature, critical low oil pressure, or overspeed), the health score is capped to $\le 45$ and forced to `CRITICAL`, preventing high ML scores from masking danger. |
| [`ml/rul/train.py`](file:///c:/Users/niran/OneDrive/Desktop/DHRUVA/ml/rul/train.py) | **Scientific Rigor** | Updated `predict_rul()` return dictionary to specify `"uncertainty_type": "heuristic_spread"` and add an interval coverage disclaimer, removing false claims of a 95% conformal prediction interval. |
| [`ml/evaluate_pipeline.py`](file:///c:/Users/niran/OneDrive/Desktop/DHRUVA/ml/evaluate_pipeline.py) | **New Evaluation Tool** | Built a leakage-safe evaluation pipeline using a temporal 75/25 split on `ENG001` trajectories and 100% held-out test evaluation on the `O320` flight mission. Outputs per-class metrics, confusion matrix, RUL MAE/RMSE, and empirical interval coverage. |
| [`ml/train_all.py`](file:///c:/Users/niran/OneDrive/Desktop/DHRUVA/ml/train_all.py) | **Automation** | Automatically synchronizes and exports the full combined 940-row dataset to [`data/processed/trained_dataset.csv`](file:///c:/Users/niran/OneDrive/Desktop/DHRUVA/data/processed/trained_dataset.csv) before training and serializing model artifacts. |
| [`tests/ml/test_cleaning.py`](file:///c:/Users/niran/OneDrive/Desktop/DHRUVA/tests/ml/test_cleaning.py) | **Test Coverage** | Added `test_frozen_sensor_detection()` verifying that 6 consecutive constant readings set `sensor_status = "FROZEN_SENSOR"` and flag data as invalid. |
| [`tests/integration/test_complete_system_e2e.py`](file:///c:/Users/niran/OneDrive/Desktop/DHRUVA/tests/integration/test_complete_system_e2e.py) | **E2E Gate H Test** | Added `test_gate_h_constraint_aware_health_precedence()` verifying that posting critical temperature exceedance (`275°C > max 240°C`) caps health score to $\le 45$ and forces status to `CRITICAL`. |

---

## 2. Test Execution & Outcomes

All tests run locally in the Python 3.12 virtual environment:

### Command:
```bash
.\.venv\Scripts\python.exe -m pytest
```

### Result:
- **Total Tests**: **181 passed** (0 failed, 9 deprecation warnings)
- **Execution Time**: ~42.3 seconds
- **Pass Rate**: **100%**

```
tests/aero_engine/test_aero_api.py .................                   [  9%]
tests/aero_engine/test_aero_diagnostics.py ...........                  [ 15%]
tests/aero_engine/test_aero_physics.py ..............                   [ 23%]
tests/aero_engine/test_aero_scenarios.py .........                     [ 28%]
tests/auto_engine/test_adversarial_qa.py ..............                 [ 35%]
tests/auto_engine/test_auto_api.py .....................                [ 47%]
tests/auto_engine/test_catalog_registry.py ........                     [ 51%]
tests/auto_engine/test_component_degradation.py .......                 [ 55%]
tests/auto_engine/test_dyno_simulation.py .........                     [ 60%]
tests/auto_engine/test_fault_graph_intelligence.py .........            [ 65%]
tests/auto_engine/test_physics_engine.py ..........                     [ 71%]
tests/auto_engine/test_telemetry_generator.py ........                  [ 75%]
tests/integration/test_complete_system_e2e.py ..................        [ 85%]
tests/ml/test_anomaly.py ....                                           [ 87%]
tests/ml/test_cleaning.py .......                                       [ 91%]
tests/ml/test_fault_classification.py .....                             [ 94%]
tests/ml/test_feature_engineering.py .....                               [ 97%]
tests/ml/test_new_schema.py ..............                              [100%]

======================== 181 passed, 9 warnings in 42.31s =====================
```

### Command to Reproduce Evaluation Pipeline:
```bash
.\.venv\Scripts\python.exe -m ml.evaluate_pipeline
```

---

## 3. Remaining Work & Future Hardening

1. **Conformal Prediction for RUL**:
   - Collect or generate multi-flight degradation trajectories across varying ambient conditions to fit an inductive conformal predictor (e.g., using MAPIE or non-conformity quantile scoring) for guaranteed 95% marginal coverage.
2. **Engine Family Normalization for Anomaly Detection**:
   - In heterogeneous fleets, normalize feature vectors by engine-specific nominal ratings (e.g. $T / T_{nominal}, P / P_{nominal}$) prior to feeding the shared Isolation Forest to reduce false positive rates on non-Rotax aircraft engines.
3. **Hardware-in-the-Loop Validation**:
   - Evaluate model predictions against real physical dynamometer sensor recordings when test cell data becomes available.
