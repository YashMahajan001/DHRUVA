# DHRUVA ML AUDIT DEFECT & REPAIR FIX LOG

**Audit & Remediation Date**: October 2026  
**Auditor**: Senior Machine Learning & Systems Verification Engineer  
**Resolution Status**: All confirmed defects resolved and verified by automated regression tests  

---

## Defect 1: Missing ML Model Artifacts Causing Silent Heuristic Fallback

- **Defect ID**: `ML-DEFECT-001`
- **Severity**: HIGH
- **Component**: `ml/inference/inference_service.py` & `ml/artifacts/`
- **Root Cause**:
  `ml/artifacts/` contained only `.gitkeep`, `.gitignore`, and a stale `training_report.json` referencing external absolute paths (`D:\DHRUVA-1\...`). Because `anomaly_isolation_forest.joblib`, `fault_classifier.joblib`, and `rul_model.joblib` did not exist on disk, `_try_model_anomaly`, `_try_model_fault`, and `_try_model_rul` evaluated `if not Path(MODEL_PATH).exists(): return fallback` as `True`. Inference calls silently fell back to heuristic approximations instead of genuine ML model executions.
- **Files Changed**:
  - `ml/train_all.py`
  - `ml/artifacts/training_report.json`
  - Generated:
    - `ml/artifacts/anomaly_isolation_forest.joblib`
    - `ml/artifacts/anomaly_isolation_forest_preprocessor.joblib`
    - `ml/artifacts/fault_classifier.joblib`
    - `ml/artifacts/fault_classifier_preprocessor.joblib`
    - `ml/artifacts/rul_model.joblib`
    - `ml/artifacts/rul_model_preprocessor.joblib`
- **Repair**:
  Executed `ml.train_all` to train and serialize the Isolation Forest anomaly detector, Random Forest fault classifier, and Random Forest RUL regressor to `ml/artifacts/`. Ensured `training_report.json` accurately records model artifact paths and row metadata.
- **Regression Test**:
  - Automated test in `tests/ml/test_anomaly.py`, `tests/ml/test_fault_classification.py`.
  - Python runtime inference test verifying `run_inference(df)` directly loads `.joblib` artifacts and outputs model predictions (`{'type': 'cooling_degradation', 'confidence': 0.8097, 'backend': 'RandomForestClassifier'}`).
- **Actual Result**: **RESOLVED & VERIFIED**. Real model inference is now active across all telemetry evaluation cycles.

---

## Defect 2: Dataset Loader Omitted Missions Directory in Telemetry CSV Globs

- **Defect ID**: `ML-DEFECT-002`
- **Severity**: MEDIUM
- **Component**: `ml/utils/sample_data.py`
- **Root Cause**:
  `TELEMETRY_CSV_GLOBS` in `ml/utils/sample_data.py` was defined as:
  ```python
  TELEMETRY_CSV_GLOBS = (
      "data/synthetic/faults/**/*.csv",
      "data/synthetic/healthy/**/*.csv",
  )
  ```
  The synthetic dataset `sample_cooling_o320_60s.csv` was stored in `data/synthetic/missions/`. As a consequence, `load_external_dataset()` found zero files in `faults` or `healthy` subdirectories and returned `None`.
- **Files Changed**:
  - `ml/utils/sample_data.py`
- **Repair**:
  Updated `TELEMETRY_CSV_GLOBS` to include `"data/synthetic/missions/**/*.csv"`:
  ```python
  TELEMETRY_CSV_GLOBS = (
      "data/synthetic/faults/**/*.csv",
      "data/synthetic/healthy/**/*.csv",
      "data/synthetic/missions/**/*.csv",
  )
  ```
- **Regression Test**:
  `test_load_external_dataset_is_telemetry_only` in `tests/ml/test_new_schema.py`.
- **Actual Result**: **RESOLVED & VERIFIED**. `load_external_dataset()` successfully loads and validates 60 rows from `sample_cooling_o320_60s.csv`.

---

## Defect 3: Test CSV Guard Checked File Presence Rather than Loader Return Value

- **Defect ID**: `ML-DEFECT-003`
- **Severity**: MEDIUM
- **Component**: `tests/ml/test_new_schema.py`
- **Root Cause**:
  `_has_csvs()` in `tests/ml/test_new_schema.py` checked:
  ```python
  def _has_csvs() -> bool:
      return any(Path("data").glob("synthetic/**/*.csv"))
  ```
  Because files existed under `data/synthetic/` (like mission CSVs or Digital Twin CSVs), `_has_csvs()` returned `True`. However, `load_external_dataset()` returned `None`. In `test_run_inference_on_csv_telemetry`, calling `data.head(100)` caused an uncaught `AttributeError: 'NoneType' object has no attribute 'head'`, breaking the test suite.
- **Files Changed**:
  - `tests/ml/test_new_schema.py`
- **Repair**:
  Updated `_has_csvs()` to directly query `load_external_dataset()`:
  ```python
  def _has_csvs() -> bool:
      data = load_external_dataset()
      return data is not None and not data.empty
  ```
- **Regression Test**:
  `pytest tests/ml/test_new_schema.py`.
- **Actual Result**: **RESOLVED & VERIFIED**. All 14 tests in `tests/ml/test_new_schema.py` pass cleanly.

---

## Defect 4: Single-Source Training Incomplete Fault Class Coverage

- **Defect ID**: `ML-DEFECT-004`
- **Severity**: HIGH
- **Component**: `ml/train_all.py`
- **Root Cause**:
  When `load_external_dataset()` was used in isolation, `sample_cooling_o320_60s.csv` only contained 2 classes (`healthy` and `cooling_degradation`). Training the multiclass classifier on this dataset alone caused the remaining 9 failure modes (`overheating`, `misfire`, `lubrication_loss`, `abnormal_vibration`, `alternator_degradation`, `sensor_bias`, `sensor_drift`, `sensor_dropout`, `injector_degradation`) to be omitted from the model's vocabulary and decision trees.
- **Files Changed**:
  - `ml/train_all.py`
- **Repair**:
  Updated `ml/train_all.py` to concatenate both the external CSV datasets and the 11-class synthetic baseline fixtures from `make_training_dataset()`:
  ```python
  external = load_external_dataset()
  fixtures = make_training_dataset()
  if external is not None and not external.empty:
      dataset = pd.concat([fixtures, external], ignore_index=True)
      source = "ml fixtures + data/ synthetic CSVs"
  else:
      dataset = fixtures
      source = "ml fixtures"
  ```
- **Regression Test**:
  Checked `value_counts()` on training data: confirmed 940 samples across all 11 classes. Verified multiclass evaluation on fault scenarios.
- **Actual Result**: **RESOLVED & VERIFIED**. Model learns all 11 fault categories with balanced sample representation.
