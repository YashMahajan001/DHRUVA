<div align="center">

# DHRUVAA

### AI-Enabled Digital Twin Platform for Real-Time Health Monitoring, Fault Detection, RUL Prediction & Mission-Aware Optimization of Aero Piston Engines in MALE UAVs

[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![TailwindCSS 4](https://img.shields.io/badge/Tailwind-4.1-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-Proprietary-red)]()

**Problem Statement ID:** SIH 26054 — Smart India Hackathon 2026

</div>

---

> **Disclaimer:** This is a representative prototype built for SIH 2026. It does not contain classified, proprietary, certified, or operational DRDO engine data or aircraft safety limits. All engine parameters, mission profiles, and safety thresholds are synthetic demonstration values.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Novelties & USPs](#-key-novelties--usps)
- [System Architecture](#-system-architecture)
- [Module Breakdown](#-module-breakdown)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [API Reference](#-api-reference)
- [Project Structure](#-project-structure)
- [ML Pipeline Details](#-ml-pipeline-details)
- [Digital Twin Engine](#-digital-twin-engine)
- [Mission Profiles & Fault Injection](#-mission-profiles--fault-injection)
- [Testing](#-testing)
- [Phase Documentation](#-phase-documentation)

---

## 🎯 Overview

**DHRUVAA** (Digital Health & Readiness UAV Analytics Architecture) is a full-stack, AI-enabled **Digital Twin platform** designed for real-time health monitoring, predictive maintenance, and mission-aware optimization of aero piston engines powering Medium-Altitude Long-Endurance (MALE) Unmanned Aerial Vehicles (UAVs).

The platform creates a **virtual physics-based replica** (digital twin) of each engine in a UAV fleet, continuously comparing expected sensor behavior against live telemetry to detect anomalies, classify faults, predict Remaining Useful Life (RUL), and deliver actionable maintenance intelligence — all through a tactical aerospace-grade command console interface.

### What DHRUVAA Does

| Capability | Description |
|---|---|
| **Real-Time Telemetry Monitoring** | WebSocket-streamed engine data with sub-second latency across CHT, EGT, RPM, oil, vibration, and 20+ sensor channels |
| **Physics-Based Digital Twin** | Expected-vs-actual residual analysis using first-principles engine models for each sensor channel |
| **Multi-Model ML Inference** | Anomaly detection (Isolation Forest), fault classification (XGBoost), RUL estimation, trend forecasting, and sensor drift detection |
| **AI Engineering Copilot** | Natural language query interface with deterministic tool routing for flight deck diagnostics and advisory |
| **Mission Simulation Sandbox** | Pre-flight mission profiling across 6 tactical mission types with fault injection scenarios |
| **Fleet-Wide Monitoring** | Multi-engine, multi-UAV fleet health overview with comparative analytics |
| **Predictive MRO Scheduling** | Maintenance, Repair & Overhaul scheduling driven by RUL predictions and health trends |
| **Explainable AI (XAI)** | SHAP-based feature contribution analysis for every ML prediction |

---

## 🏆 Key Novelties & USPs

### 1. 🔬 Physics + AI Hybrid Health Intelligence
Unlike pure data-driven approaches, DHRUVAA fuses a **first-principles physics engine** with ML models. The digital twin computes expected sensor values from thermodynamic, lubrication, combustion, and cooling relationships — then ML models analyze the *residuals* (deviations), not raw telemetry. This **physics-informed residual approach** dramatically reduces false positives and enables anomaly detection even with limited training data.

### 2. 🧠 Multi-Disciplinary Subsystem Health Scoring
The Health Index (0–100) isn't a single model output — it's a **weighted, EMA-smoothed composite** across 6 subsystem domains:
- **Thermal** (CHT, EGT, oil temperature)
- **Lubrication** (oil pressure, oil temperature)
- **Mechanical** (vibration RMS)
- **Combustion** (fuel flow, RPM)
- **Electrical** (battery voltage, alternator current)
- **Sensor/Data Quality** (residuals + dropout detection)

Each subsystem score uses exponential decay from normalized residuals, blended toward the worst-performing component for safety-first behavior.

### 3. 🤖 AI Engineering Copilot with Deterministic Tool Routing
The integrated **DHRUVA AI Copilot** is not a general-purpose chatbot. It uses **deterministic intent classification** with regex-based routing to 7 specialized analytical tools (engine health, telemetry, fault analysis, RUL estimation, mission simulation, tuning evaluation, maintenance advisory). Every response is **grounded in quantitative evidence** from the digital twin and ML pipeline — never hallucinated.

### 4. 🎯 Mission-Aware Engine Optimization
Engine behavior is modeled as a function of **mission profile**, not just operating conditions. Six tactical MALE UAV mission types (High-Altitude ISR, Long-Endurance Loiter, Rapid Response, Hot Weather, Maritime Patrol, Custom) each produce distinct throttle schedules, altitude profiles, and thermal loading patterns. The digital twin adapts its expected-value computations to the active mission context.

### 5. ⚡ 11-Type Fault Injection with Progressive Degradation
The simulation engine supports **11 distinct fault types** with configurable onset time, duration, severity (0–1), and progression mode (gradual/sudden). Multiple faults can be composed simultaneously. Each fault type perturbs only its physically-related sensor channels, enabling realistic multi-fault training data generation.

### 6. 🖥️ Tactical Aerospace HUD Interface
The frontend is designed as a **dark-themed aerospace command console** with:
- Tactical flight strips and mission summary bars
- Digital twin cutaway visualization with animated subsystem health
- Real-time waveform telemetry charts with WebSocket streaming
- Bayesian anomaly decision trees
- Priority-ranked maintenance queues
- Cinematic DHRUVA shield entry sequence with video-synchronized UI reveal

### 7. 📊 SHAP-Powered Explainable Diagnostics
Every ML prediction (anomaly score, fault classification, RUL estimate) includes **SHAP feature importance** breakdowns, making the AI's reasoning transparent and auditable — critical for aerospace safety applications where "black box" AI is unacceptable.

### 8. 🔄 Sensor Drift & Bias Detection
A dedicated **sensor drift detector** uses rolling statistics and twin residuals to identify gradual calibration drift, sudden bias shifts, and sensor dropouts — distinguishing instrumentation faults from actual engine degradation.

### 9. 🏗️ Configurable, Extensible Engine Library
Engine models are defined as **JSON configuration files** with tunable physics coefficients (not hardcoded). Adding a new engine class requires only a JSON file in `configs/engines/` and registering the model — no code changes to the physics engine.

### 10. 🌐 Dual-Protocol Streaming Architecture
Real-time data flows through both **WebSocket** (browser-to-server) and **MQTT** (edge-to-cloud) channels, supporting deployment from edge gateways on UAV ground control stations to cloud-hosted fleet dashboards.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DHRUVAA PLATFORM                             │
│                                                                     │
│  ┌──────────────┐    ┌──────────────┐    ┌────────────────────┐    │
│  │   Frontend    │◄──►│   Backend    │◄──►│   Digital Twin     │    │
│  │  React + TS   │    │   FastAPI    │    │  Physics Engine    │    │
│  │  Tactical HUD │    │  REST + WS   │    │  Residual Analysis │    │
│  └──────────────┘    └──────┬───────┘    └────────┬───────────┘    │
│                             │                      │                │
│                    ┌────────┴────────┐    ┌────────┴───────────┐    │
│                    │   ML Pipeline   │    │  Simulation Engine │    │
│                    │  Anomaly/Fault  │    │  Telemetry Gen     │    │
│                    │  RUL/Drift/XAI  │    │  Fault Injection   │    │
│                    └────────┬────────┘    └────────────────────┘    │
│                             │                                       │
│                    ┌────────┴────────┐    ┌────────────────────┐    │
│                    │   AI Copilot    │    │     Streaming      │    │
│                    │  Intent Route   │    │  WebSocket + MQTT  │    │
│                    │  7 Tool Agents  │    │  Pub/Sub Channels  │    │
│                    └─────────────────┘    └────────────────────┘    │
│                                                                     │
│  ┌──────────────┐    ┌──────────────┐    ┌────────────────────┐    │
│  │   Database    │    │   Configs    │    │      Data          │    │
│  │  SQLite/PG    │    │  JSON-based  │    │  Generators/Schema │    │
│  └──────────────┘    └──────────────┘    └────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Module Breakdown

### `backend/` — FastAPI REST API & Data Layer
The server backbone exposing 12+ API route groups:

| Route Group | Endpoints | Purpose |
|---|---|---|
| `/api/v1/engines` | CRUD + status | Fleet engine registry and live status |
| `/api/v1/telemetry` | History + live | Telemetry data retrieval and WebSocket bridge |
| `/api/v1/health` | Scores + trends | Subsystem health indices and temporal trends |
| `/api/v1/faults` | Detection + logs | Fault event detection and historical log |
| `/api/v1/missions` | CRUD + active | Mission lifecycle management |
| `/api/v1/alerts` | Active + history | Priority-ranked alert management |
| `/api/v1/maintenance` | Schedule + MRO | Predictive maintenance scheduling |
| `/api/v1/subsystems` | Per-component | Component-level health breakdown |
| `/api/v1/reports` | Generation | Engineering diagnostic reports |
| `/api/v1/tuning` | Calibration | Digital twin tuning and calibration |
| `/api/v1/fleet` | Overview + compare | Multi-UAV fleet comparative analytics |
| `/api/v1/agent/query` | NL interface | AI Copilot natural language endpoint |
| `/ws/telemetry` | WebSocket | Real-time global telemetry stream |
| `/ws/telemetry/{id}` | WebSocket | Per-engine telemetry stream |

### `frontend/` — React 19 + TypeScript Tactical Dashboard
A premium aerospace-grade command console UI with 10 pages and 40+ components:

| Page | Key Components |
|---|---|
| **Entry** | Cinematic DHRUVA shield animation with video-synchronized login reveal |
| **Login** | Secure authentication with military-grade visual design |
| **Executive Overview** | Fleet-wide KPIs, health summary, alert matrix, trend charts |
| **Dashboard** | Real-time telemetry cards, digital twin HUD, mission flight strip, MRO scheduler |
| **Engine Details** | Per-engine deep-dive with waveform charts, component inspector, twin viewport |
| **Fault Diagnostics** | Root cause analysis, Bayesian anomaly trees, fault timeline |
| **Mission Simulation** | Pre-flight mission profiling sandbox |
| **Mission Tuning** | Digital twin calibration and performance map evaluation |
| **Fleet Monitoring** | Multi-UAV airspace monitoring and fleet ranking |
| **Maintenance** | Predictive MRO scheduler with priority queues |

### `digital_twin/` — Physics-Based Engine Replica
| Module | Purpose |
|---|---|
| `twin.py` | Core `DigitalTwin` class — sequential state machine processing each telemetry sample |
| `physics/` | First-principles models: altitude effects, combustion, cooling, lubrication, thermodynamics |
| `health.py` | Component health scoring with exponential decay and weighted composite index |
| `residuals.py` | Expected-vs-actual residual computation across all sensor channels |
| `state.py` | `TwinState` dataclass — complete snapshot of twin state per timestep |
| `engines/` | Engine model library (O320, Rotax914, AE300 classes) |
| `state_estimator/` | Kalman-style state estimation for lagged variables |

### `ml/` — AI/ML Inference Pipeline
| Module | Algorithm | Purpose |
|---|---|---|
| `anomaly_detection/` | Isolation Forest | Unsupervised anomaly scoring on engineered features |
| `fault_classification/` | XGBoost | Multi-class fault type classification |
| `rul/` | Gradient Boosting | Remaining Useful Life estimation from health trends |
| `trend_forecasting/` | Statistical extrapolation | Short-term sensor trend prediction |
| `sensor_drift/` | Rolling statistics + residuals | Drift, bias, and dropout detection |
| `explainability/` | SHAP | Feature contribution analysis for all predictions |
| `inference/` | Unified service | Single `run_inference()` entry point aggregating all models |
| `data_processing/` | Cleaning + feature engineering | Telemetry preprocessing and derived feature computation |

### `agent/` — AI Engineering Copilot
An NLP-driven diagnostic assistant with 7 analytical tools:

| Tool | Capability |
|---|---|
| `engine_health` | Real-time subsystem health retrieval and interpretation |
| `telemetry` | Sensor data inspection and trend analysis |
| `fault_analysis` | Root cause analysis and fault classification |
| `rul_analysis` | Remaining useful life estimation and degradation assessment |
| `mission_simulator` | Pre-flight mission readiness evaluation |
| `tune_simulator` | Performance map and FADEC tuning evaluation |
| `maintenance` | MRO scheduling and maintenance advisory |

### `simulation/` — Synthetic Telemetry Generation
Reproducible, physics-based synthetic data generation with fault injection for ML training and system validation.

### `streaming/` — Real-Time Data Transport
Dual-protocol streaming via WebSocket (browser clients) and MQTT (edge/IoT gateways) with per-engine and global broadcast channels.

---

## ⚙️ Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Python 3.10+** | Core language |
| **FastAPI** | Async REST API framework |
| **Uvicorn** | ASGI server with hot-reload |
| **SQLAlchemy 2.0** | ORM with SQLite/PostgreSQL support |
| **Pydantic v2** | Schema validation and serialization |
| **WebSockets** | Real-time telemetry streaming |

### AI/ML
| Technology | Purpose |
|---|---|
| **scikit-learn** | Anomaly detection (Isolation Forest) + base models |
| **XGBoost** | Fault classification + RUL prediction |
| **SHAP** | Explainable AI feature importance |
| **NumPy / Pandas / SciPy** | Numerical computation and data processing |
| **Joblib** | Model serialization and persistence |

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI framework |
| **TypeScript 5.7** | Type-safe development |
| **Vite 6** | Build tool and dev server |
| **TailwindCSS 4** | Utility-first styling |
| **Recharts** | Interactive telemetry charts |
| **Framer Motion** | Micro-animations and transitions |
| **Lucide React** | Aerospace-themed iconography |
| **React Router v7** | Client-side routing |

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm 9+

### 1. Clone & Setup Python Environment
```bash
git clone https://github.com/YashMahajan001/DHRUVA.git
cd DHRUVA

# Create and activate virtual environment
python -m venv .venv

# Windows
.\.venv\Scripts\Activate.ps1
# Linux/macOS
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Start the Backend
```bash
python -m uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```
The API will be available at `http://localhost:8000` with interactive docs at `http://localhost:8000/docs`.

### 3. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
The dashboard will be available at `http://localhost:3000`.

### 4. Generate Synthetic Data (Optional)
```bash
python generate_demo.py
```
This generates healthy and fault-injected telemetry datasets in `data/synthetic/`.

---

## 📡 API Reference

Interactive API documentation is auto-generated and available at:
- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`
- **OpenAPI JSON:** `http://localhost:8000/openapi.json`

---

## 📁 Project Structure

```
DHRUVA/
├── backend/                    # FastAPI backend server
│   └── app/
│       ├── api/                # 12+ route modules (engines, telemetry, health, faults, etc.)
│       ├── core/               # Settings and configuration
│       ├── database/           # SQLAlchemy connection, session, and init
│       ├── middleware/         # CORS, request logging, error handling
│       ├── models/             # SQLAlchemy ORM models
│       ├── schemas/            # Pydantic request/response schemas
│       ├── services/           # Business logic layer
│       └── utils/              # Shared utilities
│
├── frontend/                   # React 19 + TypeScript tactical dashboard
│   └── src/
│       ├── components/         # 40+ components (dashboard, health, telemetry, copilot, etc.)
│       ├── pages/              # 10 page views
│       ├── context/            # React context providers (Auth, Engine)
│       ├── hooks/              # Custom React hooks
│       ├── services/           # API client and mock data
│       ├── types/              # TypeScript type definitions
│       └── utils/              # Frontend utilities
│
├── digital_twin/               # Physics-based digital twin engine
│   ├── twin.py                 # Core DigitalTwin class
│   ├── physics/                # First-principles models (thermo, combustion, lubrication, etc.)
│   ├── engines/                # Engine model library
│   ├── health.py               # Component health scoring
│   ├── residuals.py            # Expected-vs-actual analysis
│   ├── state.py                # TwinState dataclass
│   ├── state_estimator/        # Kalman-style state estimation
│   └── validity.py             # Data and physics validity checks
│
├── ml/                         # AI/ML inference pipeline
│   ├── anomaly_detection/      # Isolation Forest model
│   ├── fault_classification/   # XGBoost classifier
│   ├── rul/                    # Remaining Useful Life estimator
│   ├── trend_forecasting/      # Trend extrapolation
│   ├── sensor_drift/           # Drift, bias, and dropout detection
│   ├── explainability/         # SHAP feature importance
│   ├── inference/              # Unified inference service
│   ├── data_processing/        # Cleaning and feature engineering
│   └── twin_adapter.py         # Digital twin ↔ ML bridge
│
├── agent/                      # AI Engineering Copilot
│   ├── agent.py                # DhruvaAgent orchestration class
│   ├── tools/                  # 7 analytical tool implementations
│   └── prompts/                # System and diagnostic prompts
│
├── simulation/                 # Synthetic telemetry generation engine
│   ├── engine_simulator.py     # Physics-based telemetry generation
│   ├── fault_injector.py       # Configurable fault injection
│   ├── mission_profiles/       # Mission phase definitions
│   ├── missions/               # Mission execution logic
│   └── replay/                 # Telemetry replay utilities
│
├── streaming/                  # Real-time data transport
│   ├── websocket/              # WebSocket connection manager
│   └── mqtt/                   # MQTT publisher and subscriber
│
├── data/                       # Data generators, schemas, and datasets
│   ├── generators/             # Telemetry and noise generators
│   ├── faults/                 # Fault type definitions and injection
│   ├── schemas/                # Canonical telemetry schema
│   └── synthetic/              # Generated datasets (gitignored)
│
├── database/                   # SQL schema, migrations, and seed data
│   ├── schema.sql              # Full PostgreSQL schema definition
│   ├── migrations/             # Database migrations
│   └── seed/                   # Initial seed data (engines, missions)
│
├── configs/                    # JSON configuration files
│   ├── engines/                # Engine model parameters (O320, Rotax914, AE300)
│   ├── missions/               # Mission profile definitions (6 types)
│   ├── faults/                 # Fault type configurations (11 types)
│   ├── simulation/             # Simulation parameters
│   ├── safety/                 # Safety threshold configurations
│   └── twin/                   # Digital twin health scoring config
│
├── tests/                      # Comprehensive test suite (79 tests)
│   ├── backend/                # API and service tests
│   ├── digital_twin/           # Twin physics and health tests
│   ├── ml/                     # ML model and inference tests
│   ├── simulation/             # Simulation engine tests
│   └── integration/            # End-to-end integration tests
│
├── docs/                       # Project documentation
│   ├── phase1.md               # Phase 1: Synthetic data + simulation
│   └── phase2.md               # Phase 2: Digital twin + health intelligence
│
├── pyproject.toml              # Python project metadata and dependencies
├── requirements.txt            # Pip dependency list
├── pytest.ini                  # Test configuration
├── generate_demo.py            # Demo data generation script
└── .gitignore                  # Git ignore rules
```

---

## 🧪 ML Pipeline Details

### Inference Flow
```
Raw Telemetry → Cleaning → Feature Engineering → Parallel Model Inference
                                                    ├── Anomaly Detection (Isolation Forest)
                                                    ├── Fault Classification (XGBoost)
                                                    ├── RUL Estimation (Gradient Boosting)
                                                    ├── Trend Forecasting
                                                    ├── Sensor Drift Detection
                                                    └── SHAP Explanation
                                                           ↓
                                                   Unified ML Result
                                                           ↓
                                              Digital Twin Health Blending
```

### Engineered Features
The feature engineering pipeline computes derived signals including:
- Rate-of-change (ΔT) for thermal channels (CHT, EGT)
- Rolling statistics (mean, std, kurtosis) for vibration
- Physics prediction residuals from the digital twin
- Cross-channel correlations and ratio features
- Mission-phase-aware normalization

---

## 🔧 Digital Twin Engine

### Update Cycle (per telemetry sample)
```
1. Extract operating conditions (throttle, altitude, ambient_temp)
2. Compute expected sensor values via physics relationships
3. Calculate residuals: actual − expected
4. Normalize residuals by configurable scales
5. Score component health via exponential decay
6. Compute weighted composite Health Index (0–100)
7. Apply EMA smoothing for temporal stability
8. Optionally blend ML anomaly/degradation signals
9. Emit TwinState snapshot
```

### Supported Engine Models
| Model | Class | Representative Of |
|---|---|---|
| O320_CLASS | ~100 HP | Lycoming O-320 family |
| ROTAX914_CLASS | ~115 HP | Rotax 914 turbocharged |
| AE300_CLASS | ~170 HP | Austro Engine AE300 diesel |

---

## 🎯 Mission Profiles & Fault Injection

### Mission Types
| Profile | Characteristics |
|---|---|
| `HIGH_ALTITUDE_ISR` | Extended cruise at altitude, ISR payload, reduced air density |
| `LONG_ENDURANCE_LOITER` | Low throttle, maximum endurance, fuel efficiency optimized |
| `RAPID_RESPONSE` | Aggressive climb, high throttle, fast transit |
| `HOT_WEATHER` | High ambient temperature, reduced cooling effectiveness |
| `MARITIME_PATROL` | Salt air corrosion factors, sea-level operations |
| `CUSTOM` | User-defined throttle and altitude profiles |

### Fault Types (11 Total)
| Category | Faults |
|---|---|
| **Mechanical** | Abnormal Vibration |
| **Thermal** | Cooling Degradation, Overheating |
| **Combustion** | Injector Degradation, Combustion Disturbance |
| **Lubrication** | Lubrication Pressure Loss |
| **Electrical** | Alternator Degradation, Battery Degradation |
| **Sensor** | Sensor Bias, Sensor Drift, Sensor Dropout |

---

## ✅ Testing

```bash
# Run all 79 tests
python -m pytest

# Run with verbose output
python -m pytest -v

# Run specific module tests
python -m pytest tests/digital_twin/
python -m pytest tests/ml/
python -m pytest tests/backend/
```

---

## 📖 Phase Documentation

| Phase | Document | Scope |
|---|---|---|
| Phase 1 | [docs/phase1.md](docs/phase1.md) | Synthetic telemetry generation, engine simulation, physics models, fault injection |
| Phase 2 | [docs/phase2.md](docs/phase2.md) | Digital twin residual analysis, component health scoring, ML integration interface |

---

<div align="center">

**Built for Smart India Hackathon 2026 — Problem Statement SIH 26054**

*Empowering proactive aerospace maintenance through physics-informed AI and real-time digital twin intelligence.*

</div>
