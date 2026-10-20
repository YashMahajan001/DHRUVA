# DHRUVA — MACHINE LEARNING EVALUATION REPORT

**Evaluation Date**: October 2026  
**Evaluation Script**: [`ml/evaluate_pipeline.py`](file:///c:/Users/niran/OneDrive/Desktop/DHRUVA/ml/evaluate_pipeline.py)  
**Dataset Analyzed**: [`data/processed/trained_dataset.csv`](file:///c:/Users/niran/OneDrive/Desktop/DHRUVA/data/processed/trained_dataset.csv) (940 rows, 57 columns)  
**Execution Command**: `python -m ml.evaluate_pipeline`  

---

## 1. Dataset Composition & Split Methodology

### 1.1 Dataset Composition
- **Total Records**: 940 samples
- **Engines Included**:
  - `ENG001` (Rotax 914 class): 880 rows across 11 fault classes (80 samples per class).
  - `O320_CLASS-SIM-01` (Lycoming O-320 class): 60 rows from high-altitude mission (`31 healthy`, `29 cooling_degradation`).

### 1.2 Leakage-Safe Splitting Strategy
Random k-fold and random train/test splits were **strictly avoided** because adjacent temporal telemetry rows exhibit strong autocorrelation, which leads to artificial over-optimism.

- **Training Set (660 rows)**:
  - First 75% (steps 0 to 59) of each 80-sample fault class trajectory for `ENG001`.
- **Test Set (280 rows)**:
  - Final 25% (steps 60 to 79) of each fault class trajectory for `ENG001` (evaluating temporal forecastability).
  - 100% of the independent `O320_CLASS-SIM-01` mission flight (evaluating true cross-engine generalization).
- **Leakage Prevention**: All scalers and imputers in [`TelemetryPreprocessor`](file:///c:/Users/niran/OneDrive/Desktop/DHRUVA/ml/data_processing/preprocessing.py) were fitted strictly on the 660 training samples and applied out-of-sample to the 280 test samples.

---

## 2. Fault Classification Evaluation Results

- **Model**: `RandomForestClassifier` (250 trees, max depth 12, balanced class weighting)
- **Balanced Accuracy**: **87.48%**
- **Macro-Averaged F1**: **0.834**
- **Weighted-Averaged F1**: **0.777**

### Per-Class Performance Breakdown

| Fault Class | Precision | Recall | F1-Score | Support (Test Set) | Operational Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **abnormal_vibration** | 1.000 | 0.900 | **0.947** | 20 | High precision on RMS and kurtosis anomalies |
| **alternator_degradation** | 0.810 | 0.850 | **0.829** | 20 | Distinct current/voltage drop signature |
| **cooling_degradation** | 0.619 | 0.531 | **0.571** | 49 | Tested against unseen O320 aircraft flight |
| **healthy** | 1.000 | 0.392 | **0.563** | 51 | Unseen O320 baseline tested without retraining |
| **injector_degradation** | 1.000 | 0.950 | **0.974** | 20 | Fuel efficiency / EGT mismatch pattern |
| **lubrication_loss** | 0.455 | 1.000 | **0.625** | 20 | 100% recall on oil pressure drops |
| **misfire** | 1.000 | 1.000 | **1.000** | 20 | Perfect separation on RPM variance |
| **overheating** | 0.741 | 1.000 | **0.851** | 20 | 100% recall on thermal exceedance |
| **sensor_bias** | 0.690 | 1.000 | **0.816** | 20 | 100% recall on residual step shift |
| **sensor_drift** | 1.000 | 1.000 | **1.000** | 20 | Perfect separation on rolling residual slope |
| **sensor_dropout** | 1.000 | 1.000 | **1.000** | 20 | Perfect separation on missingness flags |

### Confusion Matrix (11 x 11)
```
Classes: [vibration, alternator, cooling, healthy, injector, lubrication, misfire, overheating, bias, drift, dropout]
[[18,  0,  0,  0,  0,  0,  0,  2,  0,  0,  0],
 [ 0, 17,  0,  0,  0,  0,  0,  0,  3,  0,  0],
 [ 0,  4, 26,  0,  0,  9,  0,  4,  6,  0,  0],
 [ 0,  0, 16, 20,  0, 14,  0,  1,  0,  0,  0],
 [ 0,  0,  0,  0, 19,  1,  0,  0,  0,  0,  0],
 [ 0,  0,  0,  0,  0, 20,  0,  0,  0,  0,  0],
 [ 0,  0,  0,  0,  0,  0, 20,  0,  0,  0,  0],
 [ 0,  0,  0,  0,  0,  0,  0, 20,  0,  0,  0],
 [ 0,  0,  0,  0,  0,  0,  0,  0, 20,  0,  0],
 [ 0,  0,  0,  0,  0,  0,  0,  0,  0, 20,  0],
 [ 0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 20]]
```

---

## 3. Remaining Useful Life (RUL) Regressor Evaluation

- **Model**: `GradientBoostingRegressor` (150 estimators, max depth 3, learning rate 0.08)
- **Target**: Operating hours remaining until maintenance (`rul` in range [40.87, 99.87])
- **Mean Absolute Error (MAE)**: **7.71 hours**
- **Root Mean Squared Error (RMSE)**: **11.03 hours**
- **Uncertainty Method**: Heuristic spread based on health index degradation ($\Delta h = 4.0 + (100 - h) \times 0.08$)
- **Mean Interval Half-Width**: **5.75 hours**
- **Empirical Coverage Percentage**: **53.2%**

### Scientific Interpretation of Uncertainty
The evaluation demonstrates that the heuristic spread ($\pm 5.75$ hours) covers **53.2%** of test samples. It is **not** a statistically calibrated 95% confidence or conformal prediction interval. The application has been updated to explicitly label this field as `heuristic_spread` rather than misleading operators into treating it as a calibrated 95% interval.

---

## 4. Anomaly Detection Evaluation Results

- **Model**: `IsolationForest` (200 estimators, contamination 0.05, fitted strictly on healthy training records)
- **Precision**: **0.825**
- **Recall**: **0.825**
- **F1-Score**: **0.825**
- **False Positive Rate on Healthy**: **78.4%** (driven by cross-engine evaluation on unseen O-320 healthy baseline without engine-specific baseline normalization)

### Key Recommendation
When deploying across mixed fleets (Rotax 914 vs Lycoming O-320), the Anomaly Detector must either:
1. Normalize sensor inputs against the specific engine model's nominal operating baseline; or
2. Route inference through engine-family-specific model artifacts.

---

## 5. How to Reproduce Results

To execute the leakage-safe evaluation pipeline and print the full JSON report:

```bash
.\.venv\Scripts\python.exe -m ml.evaluate_pipeline
```
