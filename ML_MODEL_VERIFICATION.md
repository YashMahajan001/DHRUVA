# DHRUVA MACHINE LEARNING MODEL & PIPELINE VERIFICATION REPORT

**Report Date**: October 2026  
**Status**: VERIFIED & REPAIRED  
**Execution Environment**: Python 3.12, scikit-learn, XGBoost, pandas, numpy, joblib  

---

## 1. Overview of Deployed Models

The Dhruva platform incorporates three machine learning models within the UAV Drone digital twin pipeline, supplemented by deterministic physics simulators and diagnostic reasoning engines in the Auto and Aero domains.

Prior to this audit, physical `.joblib` model artifacts were absent from `ml/artifacts/`, causing the inference engine `ml/inference/inference_service.py` to silently fall back to heuristic calculations. With the resolution of dataset loader globs in `ml/utils/sample_data.py` and the execution of `ml/train_all.py`, genuine production model artifacts have been trained, verified, and saved to disk.

```
ml/artifacts/
├── anomaly_isolation_forest.joblib              (1.30 MB)
├── anomaly_isolation_forest_preprocessor.joblib (4.88 KB)
├── fault_classifier.joblib                      (1.87 MB)
├── fault_classifier_preprocessor.joblib         (4.88 KB)
├── rul_model.joblib                             (208.6 KB)
├── rul_model_preprocessor.joblib                (4.88 KB)
└── training_report.json                         (394 B)
```

---

## 2. Model Specifications & Verification

### 2.1 Anomaly Detection Model

- **Model Identifier**: `anomaly_isolation_forest`
- **Artifact Path**: `ml/artifacts/anomaly_isolation_forest.joblib`
- **Preprocessor Artifact**: `ml/artifacts/anomaly_isolation_forest_preprocessor.joblib`
- **Algorithm**: Scikit-Learn `IsolationForest`
- **Hyperparameters**:
  - `n_estimators`: 200
  - `max_samples`: 0.85
  - `contamination`: 0.08
  - `random_state`: 42
  - `n_jobs`: -1
- **Intended Purpose**: Detect multidimensional out-of-distribution engine operating states and unmodeled sensor dynamics.
- **Input Feature Vector** (from `ANOMALY_FEATURE_COLUMNS`):
  1. `rpm`
  2. `throttle`
  3. `cht`
  4. `egt`
  5. `oil_pressure`
  6. `oil_temperature`
  7. `fuel_flow`
  8. `vibration_rms`
  9. `physics_prediction_residual`
  10. `cht_residual`
  11. `egt_residual`
  12. `oil_pressure_residual`
  13. `vibration_rms_residual`
  14. `coolant_temp`
  15. `coolant_delta`
  16. `alternator_current`
  17. `battery_voltage`
  18. `manifold_pressure`
- **Preprocessing**: `TelemetryPreprocessor` applying median missing-value imputation, feature engineering (residuals, rate changes, fuel efficiency), and standard scaling via `StandardScaler`.
- **Inference Entry Point**: `ml.anomaly_detection.train:predict_anomaly` called from `ml.inference.inference_service:_try_model_anomaly`.
- **Output Format**:
  ```python
  {
      "detected": bool,          # True if anomaly detected
      "score": float,           # Continuous anomaly score in [0.0, 1.0]
      "severity": str           # "low", "medium", or "high"
  }
  ```
- **Runtime Verification Evidence**:
  - Test input: Healthy cruise telemetry (`cht: 185°C`, `oil_pressure: 48 psi`). Output: `{'detected': False, 'score': 0.4411, 'severity': 'low'}`.
  - Test input: Severe thermal runaway sequence (`cht: 285°C`, `oil_pressure: 14 psi`). Output: `{'detected': True, 'score': 0.5075, 'severity': 'low'}` transitioning to `score: 0.88` (high severity) on persistent fault frames.

---

### 2.2 Fault Classification Model

- **Model Identifier**: `fault_classifier`
- **Artifact Path**: `ml/artifacts/fault_classifier.joblib`
- **Preprocessor Artifact**: `ml/artifacts/fault_classifier_preprocessor.joblib`
- **Algorithm**: `RandomForestClassifier` (with fallback support for `XGBClassifier`)
- **Hyperparameters**:
  - `n_estimators`: 250
  - `max_depth`: 12
  - `class_weight`: `"balanced"`
  - `random_state`: 42
  - `n_jobs`: -1
- **Target Classes** (11 classes encoded via `LabelEncoder`):
  1. `healthy`
  2. `cooling_degradation`
  3. `overheating`
  4. `injector_degradation`
  5. `misfire`
  6. `lubrication_loss`
  7. `abnormal_vibration`
  8. `alternator_degradation`
  9. `sensor_bias`
  10. `sensor_drift`
  11. `sensor_dropout`
- **Input Feature Vector** (from `FAULT_FEATURE_COLUMNS`):
  22 engineered and calibrated physical telemetry features, strictly excluding target leakage columns (`fault_label`, `fault_active`, `fault_severity`).
- **Preprocessing**: `TelemetryPreprocessor` with robust column alignment, missing-value imputation, and `StandardScaler` scaling.
- **Inference Entry Point**: `ml.fault_classification.train:predict_fault` called from `ml.inference.inference_service:_try_model_fault`.
- **Output Format**:
  ```python
  {
      "type": str,              # Classified fault label (e.g. "cooling_degradation")
      "confidence": float,      # Softmax class probability [0.0 - 1.0]
      "backend": str            # Model architecture ("RandomForestClassifier" or "XGBClassifier")
  }
  ```
- **Runtime Verification Evidence**:
  - Verified on synthetic cooling degradation sequence (`make_cooling_demo_sequence`):
    - Input: 20-sample progressive coolant flow restriction.
    - Output: `{'type': 'cooling_degradation', 'confidence': 0.8097, 'backend': 'RandomForestClassifier'}`.
    - Correct classification verified with 80.97% model confidence.

---

### 2.3 Remaining Useful Life (RUL) Estimation Model

- **Model Identifier**: `rul_model`
- **Artifact Path**: `ml/artifacts/rul_model.joblib`
- **Preprocessor Artifact**: `ml/artifacts/rul_model_preprocessor.joblib`
- **Algorithm**: `RandomForestRegressor` (with `GradientBoostingRegressor` support)
- **Hyperparameters**:
  - `n_estimators`: 200
  - `max_depth`: 10
  - `random_state`: 42
  - `n_jobs`: -1
- **Intended Purpose**: Predict remaining flight operational hours prior to mandatory maintenance or component overhaul based on cumulative stress indicators and physics residuals.
- **Input Feature Vector** (from `RUL_FEATURE_COLUMNS`):
  Residuals, operating hours, temperatures, vibration features, strictly excluding leaky targets (`rul`, `health_index`, `ml_fault_class`).
- **Inference Entry Point**: `ml.rul.train:predict_rul` called from `ml.inference.inference_service:_try_model_rul`.
- **Output Format**:
  ```python
  {
      "hours": float,                   # Predicted remaining useful life in hours
      "uncertainty_hours": float,       # Degradation-based heuristic spread (empirically covers 53.2% of test points)
      "uncertainty_type": str,          # "heuristic_spread"
      "interval_coverage_note": str     # Explicit disclaimer that spread is not a calibrated 95% conformal interval
  }
  ```
- **Runtime Verification Evidence**:
  - Nominal baseline: `{'hours': 88.32, 'uncertainty_hours': 6.96, 'uncertainty_type': 'heuristic_spread'}`.
  - Active cooling degradation sequence: `{'hours': 69.99, 'uncertainty_hours': 8.91}` (RUL monotonically decreases under confirmed thermal degradation).
  - Measured Evaluation: MAE = 7.71 hours, RMSE = 11.03 hours on leakage-safe temporal test split. Empirical interval coverage = 53.2% with mean interval half-width of 5.75 hours.

---

## 3. Scientific Separation: ML vs Physics & Diagnostic Graphs

| Domain | Intelligence Paradigm | Primary Engine | Role of ML | Scientific Rationale |
| :--- | :--- | :--- | :--- | :--- |
| **Dhruva Drone** | Hybrid ML & Physics Residuals | `HealthService` & `ml.inference` | **Active**: IsolationForest, Classifier, Regressor | Small UAV piston telemetry features stochastic sensor noise and varied mission profiles where empirical data models complement baseline thermodynamics. |
| **Dhruva Auto** | Deterministic Physics & Root-Cause Graph | `DeterministicEngineSimulator` & `DiagnosticEngine` | **None** (Rule-Based Diagnostics) | Automotive engine calibration (BSFC, BMEP, dyno sweeps) requires deterministic physical repeatability governed by gas laws, inertial dynamics, and OEM tolerance envelopes. |
| **Dhruva Aero** | Certified Aerospace Thermodynamics | `AeroEngineSimulator` & `AeroDiagnosticEngine` | **None** (TCDS Envelope Rules) | Commercial and defense aviation digital twins must adhere to FAA/EASA certified Type Certificate Data Sheets (TCDS) and Brayton/Otto cycle equations. Arbitrary black-box neural networks are prohibited by airworthiness certification standards. |

---

## 4. Evaluation Evidence & Known Limitations

1. **Training Dataset Provenance**:
   - Models are trained on a combined dataset of 940 samples originating from `data/synthetic/missions/sample_cooling_o320_60s.csv` and `ml.utils.sample_data:make_training_dataset`.
   - All 11 operational classes are represented with balanced class distribution (80 to 111 samples per class).
2. **Current Limitations**:
   - The models are trained on calibrated synthetic aerospace datasets rather than physical dyno sensor logs from hardware in the loop (HIL).
   - RUL predictions are currently framed in normalized mission hours rather than fleet-wide multi-thousand-hour engine lifecycles.
   - Fault classification relies upon residual features extracted against the physical Digital Twin; if sensor dropout occurs on residual reference channels, confidence falls back gracefully to heuristic safety rules.
