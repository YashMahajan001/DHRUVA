# SIH26054 Digital Twin UAV — Backend & Database Handoff

**Author**: Diya Prabhu  
**Branch**: `Diya`  
**Target Audience**: Gaurav (Simulation, Streaming, Deployment) & System Integrators  

---

## 1. Executive Summary

This document outlines the architecture, database schema, API contracts, and integration interfaces implemented for the SIH26054 Digital Twin UAV backend system.

All components follow the modular domain-driven layout defined in the team specification:
- Database DDL and seeds in `database/`
- FastAPI routing, SQLAlchemy ORM, Pydantic schemas, and decoupled services in `backend/app/`
- WebSocket channels and cross-team schemas in `streaming/`
- Unit and integration test suite in `tests/backend/`

---

## 2. Database Architecture & Seed Data (`database/`)

### Schema (`database/schema.sql`)
PostgreSQL DDL defining 8 core tables with compound indexes on `(engine_id, timestamp DESC)` for fast time-series queries:
1. **`engine_models`**: Reference specifications and operational ceilings (max RPM, max temperature).
2. **`engines`**: Physical fleet UAV engine records with status (`ACTIVE`, `IDLE`, `MAINTENANCE`, `FAULT`) and cumulative flight hours.
3. **`telemetry`**: High-frequency time-series sensor data (`rpm`, `temperature`, `oil_pressure`, `fuel_flow`, `altitude`, `throttle`).
4. **`twin_states`**: Digital Twin health index evaluations (`health_score`, `health_status`, `predicted_state`).
5. **`faults`**: Active and resolved fault records with severity levels (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
6. **`missions`**: Flight mission profiles and operational states (`PLANNED`, `IN_PROGRESS`, `COMPLETED`, `ABORTED`).
7. **`tune_profiles`**: Engine parameter configurations and calibration maps.
8. **`maintenance`**: Scheduled and completed work orders.

### Seed Scripts (`database/seed/`)
- `engine_models.sql`: Seed data for Lycoming O-320-D2J, Rotax 914 F/UL, and Austro Engine AE300.
- `engines.sql`: Pre-configured fleet engines (`ENG001`, `ENG002`, `ENG003`).
- `missions.sql`: Sample operational profiles (High Altitude ISR, Long Endurance Recon, Rapid Response).

### Automatic Database Initialization & Fallback
The application runs `init_db()` upon startup:
- Connects to PostgreSQL using `DATABASE_URL`.
- If PostgreSQL is unreachable during local developer testing, gracefully falls back to SQLite (`digital_twin_uav.db`).
- Auto-provisions missing tables and populates baseline seed records if empty.

---

## 3. Backend Architecture (`backend/app/`)

### Configuration & Security (`app/core/`)
- `config.py`: Environment-driven settings (`DATABASE_URL`, `MQTT_BROKER_HOST`, `MQTT_BROKER_PORT`, `CORS_ORIGINS`, `DEBUG`).
- `security.py`: Token validation and HMAC checksum utilities.

### Database Connection (`app/database/`)
- `base.py`: SQLAlchemy `DeclarativeBase`.
- `connection.py`: Engine factory, session maker, and schema initialization.
- `session.py`: Dependency injection helper `get_db()` yielding scoped sessions per request.

### ORM Models (`app/models/`)
- `engine.py`, `telemetry.py`, `twin_state.py`, `fault.py`, `mission.py`, `tune_profile.py`, `maintenance.py`.

### Pydantic Schemas (`app/schemas/`)
- Strict Pydantic v2 schemas providing serialization and input validation (`from_attributes = True`).
- Canonical `TelemetryMessage`:
  ```json
  {
    "engine_id": "ENG001",
    "timestamp": "2026-09-06T14:20:00",
    "rpm": 2450.0,
    "temperature": 87.5,
    "oil_pressure": 42.3,
    "fuel_flow": 18.4,
    "altitude": 3500.0,
    "throttle": 72.0
  }
  ```
- Digital Twin output contract (`DigitalTwinEvaluationResult`):
  ```json
  {
    "engine_id": "ENG001",
    "timestamp": "2026-09-06T14:20:00",
    "health_score": 82.4,
    "health_status": "GOOD",
    "anomaly": false,
    "fault": null,
    "rul_hours": 124.5
  }
  ```

### Service Layer (`app/services/`)
Separates business logic from API handlers:
- `telemetry_service.py`: Ingests telemetry, persists records to the database, invokes the Digital Twin evaluator, updates engine cumulative hours, and pushes updates to WebSockets.
- `health_service.py`: Evaluates sensor values against model-specific safety envelopes. Computes a dynamic health index (0–100), operational status (`GOOD`/`WARNING`/`CRITICAL`), RUL hours estimation, and component-level status flags.
- `engine_service.py`: CRUD operations for fleet engines and specifications.
- `fault_service.py`: Controlled fault injection and resolution.
- `mission_service.py`: Flight mission planning and multi-stage synthetic mission simulation.
- `tuning_service.py`: Calibration profile management.
- `replay_service.py`: Chronological mission telemetry slices for post-flight playback.
- `reports_service.py`: Diagnostic and operational health report generation.
- `maintenance_service.py`: Maintenance tracking and scheduling.

### API Handlers (`app/api/`)
- `engines.py`: `/api/engines`, `/api/engines/{id}`, `/api/engines/{id}/telemetry`, `/api/engines/{id}/health`, `/api/engines/{id}/faults`
- `telemetry.py`: `POST /api/telemetry`, `POST /api/telemetry/batch`, `GET /api/telemetry/latest/{id}`
- `health.py`: `GET /api/health` (MVP Milestone 1), `GET /api/health/fleet-summary`
- `faults.py`: `GET /api/faults`, `POST /api/faults/inject`, `PATCH /api/faults/{id}/resolve`
- `missions.py`: `GET /api/missions`, `POST /api/missions`, `GET /api/missions/{id}`, `POST /api/missions/{id}/simulate`
- `tuning.py`: `POST /api/tuning`, `GET /api/tuning/{id}`, `GET /api/tuning/engine/{id}`
- `replay.py`: `GET /api/replay/{mission_id}`
- `reports.py`: `GET /api/reports/{id}`, `GET /api/maintenance`, `POST /api/maintenance`

---

## 4. Middleware & Streaming Integration

### Middleware (`app/middleware/`)
- `cors.py`: Allows React/Vite frontends on `http://localhost:5173`, `http://localhost:3000`, etc.
- `logging_middleware.py`: Injects `X-Process-Time-Ms` response header and logs request durations.
- `error_handler.py`: Catches domain and validation errors returning standard JSON payloads.

### Real-Time Streaming (`streaming/`)
- WebSocket endpoints:
  - `WS /ws/telemetry/{engine_id}`: Stream telemetry specifically for one engine.
  - `WS /ws/telemetry`: Broadcast stream for all engines across the fleet.
- `streaming/websocket/websocket_manager.py`: Manages client channels and handles automatic dispatch upon telemetry ingestion.

---

## 5. Testing & Verification

Automated test suite (`tests/backend/test_api.py`) verifies all 12 core capabilities:
- Health check verification
- Engine model and engine retrieval
- Telemetry ingestion and retrieval
- Digital Twin health score calculation
- Fault injection and resolution lifecycle
- Flight mission simulation
- Parameter tuning profiles
- Diagnostic report generation

Run tests locally:
```powershell
python -m pytest tests/backend -v
```

---

## 6. Integration Checklist for Gaurav

1. **Simulator (`simulation/engine_simulator.py`)**:
   - Emit telemetry matching `TelemetryMessage` JSON contract.
2. **MQTT Subscriber (`streaming/mqtt/subscriber.py`)**:
   - Route incoming MQTT messages into `telemetry_service.process_and_broadcast()` or post to `POST /api/telemetry`.
3. **Deployment (`deployment/docker-compose.yml`)**:
   - Configure PostgreSQL 16 container (`postgres:postgres@postgres:5432/digital_twin_uav`).
   - Configure Mosquitto MQTT broker container on port `1883`.
