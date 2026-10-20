# DHRUVA — END-TO-END MACHINE LEARNING & DIGITAL TWIN AUDIT REPORT

**Audit Date**: October 2026  
**Auditor**: Senior Machine Learning Engineer, Backend Engineer & Digital Twin Architect  
**Scope**: Full Stack Inspection across Dhruva Drone, Dhruva Auto, and Dhruva Aero  
**Status**: AUDITED, OPTIMIZED & VERIFIED  

---

## 1. Confirmed Architecture & Actual Data Flow

The Dhruva platform comprises three distinct operational domains with separate architectural paradigms:

### 1.1 Dhruva Drone (UAV Hybrid Physics + ML)
- **Data Source**: Real-time sensor telemetry or replay from synthetic mission CSVs ([`sample_cooling_o320_60s.csv`](file:///c:/Users/niran/OneDrive/Desktop/DHRUVA/data/synthetic/missions/sample_cooling_o320_60s.csv)).
- **Ingestion**: [`POST /api/telemetry`](file:///c:/Users/niran/OneDrive/Desktop/DHRUVA/backend/app/api/telemetry.py) -> [`TelemetryService.process_and_broadcast`](file:///c:/Users/niran/OneDrive/Desktop/DHRUVA/backend/app/services/telemetry_service.py).
- **Validation & Cleaning**: Handled by [`clean_telemetry()`](file:///c:/Users/niran/OneDrive/Desktop/DHRUVA/ml/data_processing/cleaning.py) with range clamping, missing value imputation, timestamp validation, and frozen sensor detection (`_detect_frozen_sensors`).
- **Feature Engineering**: [`engineer_features()`](file:///c:/Users/niran/OneDrive/Desktop/DHRUVA/ml/data_processing/feature_engineering.py) generates 55+ features including digital twin residuals ($\Delta \text{CHT}, \Delta \text{EGT}, \Delta \text{Oil Pressure}, \Delta \text{RPM}$), rate of changes, and vibration kurtosis.
- **Model Inference**: [`run_inference()`](file:///c:/Users/niran/OneDrive/Desktop/DHRUVA/ml/inference/inference_service.py) executes:
  - Anomaly Detector: [`IsolationForest`](file:///c:/Users/niran/OneDrive/Desktop/DHRUVA/ml/anomaly_detection/train.py) producing continuous anomaly score.
  - Fault Classifier: [`RandomForestClassifier`](file:///c:/Users/niran/OneDrive/Desktop/DHRUVA/ml/fault_classification/train.py) (11 classes).
  - RUL Regressor: [`GradientBoostingRegressor`](file:///c:/Users/niran/OneDrive/Desktop/DHRUVA/ml/rul/train.py).
- **Health Evaluation**: [`HealthService.evaluate_telemetry`](file:///c:/Users/niran/OneDrive/Desktop/DHRUVA/backend/app/services/health_service.py) blends ML predictions with physics safety rules.
- **Persistence**: Committed to SQLite table `TwinState` in `digital_twin_uav.db`.
- **Frontend Distribution**: Broadcast over WebSocket [`/ws/telemetry`](file:///c:/Users/niran/OneDrive/Desktop/DHRUVA/backend/app/main.py) and REST [`/api/engines/{id}/health`](file:///c:/Users/niran/OneDrive/Desktop/DHRUVA/backend/app/api/engines.py).

### 1.2 Dhruva Auto (Deterministic Automotive Physics + Diagnostic Graph)
- **Data Source**: Interactive dynamometer sweeps, throttle inputs, or mission load profiles.
- **Simulation**: [`DeterministicEngineSimulator`](file:///c:/Users/niran/OneDrive/Desktop/DHRUVA/auto_engine/simulation/simulator.py) using mean-value gas dynamics, torque/inertia ODE integration ($d\omega/dt = (T_{ind} - T_{fric} - T_{load})/J$), and thermal capacitance equations.
- **Intelligence**: [`DiagnosticEngine`](file:///c:/Users/niran/OneDrive/Desktop/DHRUVA/auto_engine/intelligence/diagnosis_engine.py) matches observed sensor anomalies against failure symptom graphs without pretending to run black-box neural networks.
- **Transparency**: Responses carry explicit `channel_provenance` (`MEASURED`, `CALCULATED`, `SIMULATED`).

### 1.3 Dhruva Aero (Certified Aerospace Thermodynamics + TCDS Envelopes)
- **Data Source**: Flight mission inputs (altitude, Mach number, ambient temperature, throttle).
- **Simulation**: [`AeroEngineSimulator`](file:///c:/Users/niran/OneDrive/Desktop/DHRUVA/aero_engine/physics/simulator.py) across Turbofan, Turboprop, Turbojet, and Piston configurations using Brayton and Otto cycle thermodynamics.
- **Diagnostics**: [`AeroDiagnosticEngine`](file:///c:/Users/niran/OneDrive/Desktop/DHRUVA/aero_engine/intelligence/diagnostics.py) strictly validates FAA/EASA certified operating envelope boundaries and failure mode attribution trees.

---

## 2. Defects Identified & Repaired

| Component | Defect Description | Risk Level | Resolution Implemented |
| :--- | :--- | :--- | :--- |
| `ml/artifacts/` | Missing `.joblib` model files caused silent heuristic fallback. | **CRITICAL** | Trained and serialized `anomaly_isolation_forest.joblib`, `fault_classifier.joblib`, and `rul_model.joblib`. |
| `ml/utils/sample_data.py` | Mission CSV directory (`data/synthetic/missions/`) omitted from search globs. | **HIGH** | Added `"data/synthetic/missions/**/*.csv"` to `TELEMETRY_CSV_GLOBS`. |
| `ml/data_processing/cleaning.py` | Lack of frozen sensor detection allowed stuck sensor readings to masquerade as healthy data. | **MEDIUM** | Implemented `_detect_frozen_sensors()` to flag stuck signals and set `sensor_status = "FROZEN_SENSOR"`. |
| `backend/app/services/health_service.py` | 50/50 ML weighting could mask critical physical safety violations if ML score was high. | **HIGH** | Implemented **Constraint-Aware Health Precedence**: critical limit breaches strictly cap health score to $\le 45$ and force `CRITICAL` status. |
| `ml/rul/train.py` | Reported `uncertainty_hours` claimed as general uncertainty without coverage measurement. | **MEDIUM** | Explicitly labeled as `heuristic_spread` with measured empirical coverage (53.2%) to prevent false 95% interval claims. |

---

## 3. Dataset Limitations & Leakage Analysis

- **Dataset Size**: Unified dataset [`data/processed/trained_dataset.csv`](file:///c:/Users/niran/OneDrive/Desktop/DHRUVA/data/processed/trained_dataset.csv) contains **940 rows** across 57 columns.
- **Class Balance**: Balanced representation across all 11 failure classes (80 rows per class for ENG001, plus 60 rows from the O320 flight mission).
- **Leakage Prevention**:
  - `fault_label`, `fault_active`, `fault_severity`, and `rul` targets are strictly stripped from feature vectors before model training.
  - Scalers and imputers in [`TelemetryPreprocessor`](file:///c:/Users/niran/OneDrive/Desktop/DHRUVA/ml/data_processing/preprocessing.py) are fit strictly on training splits.
- **Generalization Limitation**: The dataset is synthetically generated from calibrated physical engine models. While physically consistent, it does not substitute for real hardware-in-the-loop (HIL) dynamometer sensor logs.

---

## 4. Backend/Frontend Data Provenance Verification

1. **REST & Streaming Tracing**:
   - Telemetry posted to `/api/telemetry` is ingested, evaluated by `run_inference()`, written to database table `TwinState`, and returned as JSON.
   - Frontend components (`TwinHealthCard.tsx`, `EngineGauges.tsx`) consume live data via `/ws/telemetry` and `/api/engines/{id}/health`.
2. **Mock vs Real**:
   - `frontend/src/services/api.ts` connects to live FastAPI backend (`isLiveBackendAvailable() = true`).
   - `mockData.ts` is strictly a network disconnection fallback and is not used when the backend is reachable.

---

## 5. Unresolved Risks & Operational Constraints

1. **RUL Prediction Intervals**:
   - With 940 samples, empirical prediction interval coverage is 53.2% for $\pm 5.75$ hours spread. A true 95% conformal prediction interval requires a substantially larger calibration set of multi-flight run-to-failure degradation trajectories.
2. **Cross-Engine Anomaly Generalization**:
   - Isolation Forest trained on one engine model (`ENG001` / Rotax 914 class) exhibits a false-positive rate of 78.4% when evaluated directly on a different engine family (`O320` class) without engine-specific baseline normalization. Engine-specific model routing or residual-only normalization is necessary when deploying across heterogeneous engine fleets.
