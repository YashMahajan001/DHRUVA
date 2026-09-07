# DHRUVAA — API Endpoints Summary

> [!NOTE]
> All endpoints below are now **implemented** in the backend (`backend/app/api/`). The frontend may still fall back to local mock data when the backend is unreachable.

## Architecture

- **Base URL**: `VITE_API_BASE_URL` env var (defaults to `''` or `http://localhost:8000/api/v1`)
- **Transport**: REST (fetch) + WebSocket for real-time telemetry
- **Fallback**: Every frontend service gracefully falls back to hardcoded mock data from [`mockData.ts`](file:///d:/DHRUVA-1/sample_frontend/frontend/src/services/mockData.ts) when the backend is unreachable.

---

## REST Endpoints

### Engines

| Method | Endpoint | Frontend Service | Description |
|--------|----------|-----------------|-------------|
| `GET` | `/api/v1/engines` | [`engineService.ts`](file:///d:/DHRUVA-1/sample_frontend/frontend/src/services/engineService.ts), [`tuningApi.ts`](file:///d:/DHRUVA-1/sample_frontend/frontend/src/services/tuningApi.ts), [`engineDetailsApi.ts`](file:///d:/DHRUVA-1/sample_frontend/frontend/src/services/engineDetailsApi.ts), [`maintenanceTelemetryService.ts`](file:///d:/DHRUVA-1/sample_frontend/frontend/src/services/maintenanceTelemetryService.ts) | List all engine instances (4 engines) |
| `GET` | `/api/v1/engines/{id}` | [`engineService.ts`](file:///d:/DHRUVA-1/sample_frontend/frontend/src/services/engineService.ts), [`tuningApi.ts`](file:///d:/DHRUVA-1/sample_frontend/frontend/src/services/tuningApi.ts) | Get single engine by ID |

### Missions

| Method | Endpoint | Frontend Service | Description |
|--------|----------|-----------------|-------------|
| `GET` | `/api/v1/mission` | [`missionService.ts`](file:///d:/DHRUVA-1/sample_frontend/frontend/src/services/missionService.ts) | Get current active mission |
| `GET` | `/api/v1/missions` | [`tuningApi.ts`](file:///d:/DHRUVA-1/sample_frontend/frontend/src/services/tuningApi.ts), [`engineDetailsApi.ts`](file:///d:/DHRUVA-1/sample_frontend/frontend/src/services/engineDetailsApi.ts) | List all missions |
| `GET` | `/api/v1/missions/{id}` | [`tuningApi.ts`](file:///d:/DHRUVA-1/sample_frontend/frontend/src/services/tuningApi.ts) | Get mission by ID |

### Telemetry

| Method | Endpoint | Frontend Service | Description |
|--------|----------|-----------------|-------------|
| `GET` | `/api/v1/telemetry/history` | [`telemetryService.ts`](file:///d:/DHRUVA-1/sample_frontend/frontend/src/services/telemetryService.ts) | Historical telemetry time-series for trend charts |

### Alerts & Faults

| Method | Endpoint | Frontend Service | Description |
|--------|----------|-----------------|-------------|
| `GET` | `/api/v1/alerts` | [`healthService.ts`](file:///d:/DHRUVA-1/sample_frontend/frontend/src/services/healthService.ts), [`tuningApi.ts`](file:///d:/DHRUVA-1/sample_frontend/frontend/src/services/tuningApi.ts), [`engineDetailsApi.ts`](file:///d:/DHRUVA-1/sample_frontend/frontend/src/services/engineDetailsApi.ts) | List active fault/alert events |
| `PATCH` | `/api/v1/alerts/{alertId}/ack` | [`engineDetailsApi.ts`](file:///d:/DHRUVA-1/sample_frontend/frontend/src/services/engineDetailsApi.ts) | Acknowledge an alert |

### Maintenance (MRO)

| Method | Endpoint | Frontend Service | Description |
|--------|----------|-----------------|-------------|
| `GET` | `/api/v1/maintenance` | [`healthService.ts`](file:///d:/DHRUVA-1/sample_frontend/frontend/src/services/healthService.ts) | List predictive maintenance / MRO tasks |
| `POST` | `/api/v1/mro/sync` | [`maintenanceTelemetryService.ts`](file:///d:/DHRUVA-1/sample_frontend/frontend/src/services/maintenanceTelemetryService.ts) | Trigger MRO data sync |

### Subsystems

| Method | Endpoint | Frontend Service | Description |
|--------|----------|-----------------|-------------|
| `GET` | `/api/v1/subsystems` | [`engineDetailsApi.ts`](file:///d:/DHRUVA-1/sample_frontend/frontend/src/services/engineDetailsApi.ts) | List subsystem health states (cylinder, cooling, lubrication, fuel, electrical) |

### Tuning

| Method | Endpoint | Frontend Service | Description |
|--------|----------|-----------------|-------------|
| `GET` | `/api/v1/tuning/candidates` | [`tuningService.ts`](file:///d:/DHRUVA-1/sample_frontend/frontend/src/services/tuningService.ts) | Get tuning candidate configurations (alpha/beta/gamma) |

### AI Copilot Agent

| Method | Endpoint | Frontend Service | Description |
|--------|----------|-----------------|-------------|
| `POST` | `/api/v1/agent/query` | [`agentService.ts`](file:///d:/DHRUVA-1/sample_frontend/frontend/src/services/agentService.ts) | Send natural language query to AI copilot with engine/mission context |

### Fleet Monitoring (alternate prefix)

| Method | Endpoint | Frontend Service | Description |
|--------|----------|-----------------|-------------|
| `GET` | `/api/fleet` | [`fleetApi.ts`](file:///d:/DHRUVA-1/sample_frontend/frontend/src/services/fleetApi.ts) | Get fleet aggregate + all engine instances |
| `GET` | `/api/telemetry/{id}` | [`fleetApi.ts`](file:///d:/DHRUVA-1/sample_frontend/frontend/src/services/fleetApi.ts) | Get live telemetry for a specific engine |
| `GET` | `/api/twin/{id}` | [`fleetApi.ts`](file:///d:/DHRUVA-1/sample_frontend/frontend/src/services/fleetApi.ts) | Get digital twin state for a specific engine |
| `GET` | `/api/alerts` | [`fleetApi.ts`](file:///d:/DHRUVA-1/sample_frontend/frontend/src/services/fleetApi.ts) | Get fleet-wide alerts |

---

## WebSocket Endpoints

| Endpoint | Frontend Service | Description |
|----------|-----------------|-------------|
| `ws://…/ws/telemetry` | [`telemetryService.ts`](file:///d:/DHRUVA-1/sample_frontend/frontend/src/services/telemetryService.ts), [`engineDetailsApi.ts`](file:///d:/DHRUVA-1/sample_frontend/frontend/src/services/engineDetailsApi.ts) | Real-time telemetry stream (pushes `TelemetryEvent` per engine at ~850ms intervals) |

---

## Backend Route Files (Implemented)

| File | Domain | Status |
|------|--------|--------|
| [`engines.py`](file:///c:/Users/Gaurav%20Kulkarni/OneDrive/Desktop/DHRUVA/backend/app/api/engines.py) | `/api/engines` routes | ✅ Implemented |
| [`telemetry.py`](file:///c:/Users/Gaurav%20Kulkarni/OneDrive/Desktop/DHRUVA/backend/app/api/telemetry.py) | `/api/telemetry` + `/api/telemetry/history` | ✅ Implemented |
| [`missions.py`](file:///c:/Users/Gaurav%20Kulkarni/OneDrive/Desktop/DHRUVA/backend/app/api/missions.py) | `/api/missions` + `/api/mission` (singular) | ✅ Implemented |
| [`faults.py`](file:///c:/Users/Gaurav%20Kulkarni/OneDrive/Desktop/DHRUVA/backend/app/api/faults.py) | `/api/faults` routes | ✅ Implemented |
| [`alerts.py`](file:///c:/Users/Gaurav%20Kulkarni/OneDrive/Desktop/DHRUVA/backend/app/api/alerts.py) | `/api/alerts` + `/api/alerts/{id}/ack` | ✅ **NEW** |
| [`health.py`](file:///c:/Users/Gaurav%20Kulkarni/OneDrive/Desktop/DHRUVA/backend/app/api/health.py) | `/api/health` routes | ✅ Implemented |
| [`tuning.py`](file:///c:/Users/Gaurav%20Kulkarni/OneDrive/Desktop/DHRUVA/backend/app/api/tuning.py) | `/api/tuning` + `/api/tuning/candidates` | ✅ Implemented |
| [`subsystems.py`](file:///c:/Users/Gaurav%20Kulkarni/OneDrive/Desktop/DHRUVA/backend/app/api/subsystems.py) | `/api/subsystems` | ✅ **NEW** |
| [`agent.py`](file:///c:/Users/Gaurav%20Kulkarni/OneDrive/Desktop/DHRUVA/backend/app/api/agent.py) | `/api/agent/query` | ✅ **NEW** (stub) |
| [`fleet.py`](file:///c:/Users/Gaurav%20Kulkarni/OneDrive/Desktop/DHRUVA/backend/app/api/fleet.py) | `/api/fleet`, `/api/telemetry/{id}`, `/api/twin/{id}`, `/api/alerts` | ✅ **NEW** |
| [`reports.py`](file:///c:/Users/Gaurav%20Kulkarni/OneDrive/Desktop/DHRUVA/backend/app/api/reports.py) | `/api/reports` + `/api/mro/sync` + `/api/maintenance` | ✅ Implemented |
| [`replay.py`](file:///c:/Users/Gaurav%20Kulkarni/OneDrive/Desktop/DHRUVA/backend/app/api/replay.py) | `/api/replay` routes | ✅ Implemented |

---

## Summary Count

| Category | Count |
|----------|-------|
| **REST endpoints (unique paths)** | **17** |
| **WebSocket endpoints** | **1** |
| **Total** | **18** |
| Backend implemented | **18** (all endpoints implemented) |
| Frontend services calling endpoints | **10** |
