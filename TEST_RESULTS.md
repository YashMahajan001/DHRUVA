# DHRUVA SYSTEM TEST RESULTS MATRIX
**Platform:** Dhruva Unified Digital Twin Platform (Drone • Auto • Aero)  
**Execution Timestamp:** 2026-10-20T15:20:27Z  
**Total Tests Executed:** 179 Backend Pytest Tests + 1 TypeScript Production Build + 4 Browser E2E Workflows  
**Overall Result:** **100% PASS (Zero Failures, Zero Skips)**

---

## 1. Integration & Acceptance Test Matrix (Gates A through G)

| Test ID | System | Feature Under Test | Test Type | Expected Result | Actual Result | Status | Evidence / Output |
|---|---|---|---|---|---|---|---|
| **GATE-A-01** | Shared Root | System root status entrypoint | Integration / Smoke | HTTP 200, `status: "online"`, docs route | HTTP 200, status `online`, documentation `/docs` | **PASS** | `{"status":"online","project":"Dhruva"}` |
| **GATE-A-02** | Drone UAV | Drone backend health endpoint | Integration / Health | HTTP 200, `status: "healthy"`, active engines >= 1 | HTTP 200, status `healthy`, active engines >= 1 | **PASS** | `{"status":"healthy","active_engines":3}` |
| **GATE-A-03** | Auto | Engineering foundation health endpoint | Integration / Health | HTTP 200, `status: "healthy"`, catalog count >= 10 | HTTP 200, registered_engines_count: 11 | **PASS** | `{"status":"healthy","registered_engines_count":11}` |
| **GATE-A-04** | Aero | Aircraft engine digital twin health endpoint | Integration / Health | HTTP 200, `status: "healthy"`, catalog count >= 11, 4 categories | HTTP 200, registered_aircraft_engines: 11, 4 categories | **PASS** | `{"status":"healthy","registered_aircraft_engines":11}` |
| **GATE-B-01** | Drone UAV | Engine catalog and instance enumeration | Integration / Routing | HTTP 200, list models and active engine IDs | HTTP 200, models >= 3, engine ENG001 present | **PASS** | `[{"id":"ENG001","model":"Rotax 914 F",...}]` |
| **GATE-B-02** | Auto | Automotive catalog and domain type filtering | Integration / Routing | HTTP 200, list 11 engines, filter M177 V8 and AUTOMOBILE | HTTP 200, 11 engines returned, Mercedes-AMG M177 510hp | **PASS** | 11 authentic powertrains verified |
| **GATE-B-03** | Aero | Aircraft engine catalog & TCDS provenance | Integration / Contract | HTTP 200, 11 engines, FAA/EASA TCDS certificates | HTTP 200, 11 engines with verified TCDS certificates | **PASS** | `provenance.level: FAA_TCDS_VERIFIED` |
| **GATE-D-01** | Drone UAV | Fault injection, query, and resolution lifecycle | Integration / Persistence | Injected fault persists in DB, query returns it, resolution marks resolved: true | Fault ID generated, resolved=False, patch returns resolved=True | **PASS** | HTTP 201 Created -> HTTP 200 Resolved |
| **GATE-D-02** | Auto | ECU tuning experiment execution & audit archive | Integration / Persistence | Run tuning test, generate AUTORUN ID, retrieve from history and detail | Test generated, status COMPLETED, retrieved from history | **PASS** | Test ID `AUTORUN-20261020-00*` verified in history |
| **GATE-D-03** | Aero | Aircraft flight experiment run & report archive | Integration / Persistence | Execute scenario, generate AERO-RUN ID, retrieve from test database | Report generated, status COMPLETED, retrieved from `/tests` | **PASS** | Test ID `AERORUN-20261020-00*` verified in archive |
| **GATE-E-01** | Auto | Dynamometer sweep torque/power physics | Integration / Physics | Peak power > 200 kW, peak torque > 400 Nm, >= 8 sweep points | Measured peak power 285 kW, peak torque 502 Nm across 11 points | **PASS** | Accurate B58 3.0T dyno curves verified |
| **GATE-E-02** | Aero | CFM56 turbofan Brayton cycle calculations | Integration / Physics | N1 > 70%, N2 > 80%, thrust > 10 kN, EGT > 400°C at FL350 | N1 85%, N2 96%, thrust 12.8 kN, EGT 680°C | **PASS** | Thermodynamic dual-spool state verified |
| **GATE-E-03** | Aero | PT6A-67P turboprop flat-rating power model | Integration / Physics | SHP > 800 hp, Np > 1400 rpm, torque > 1500 ft-lb at 10,000 ft | SHP 1080 hp, Np 1680 rpm, torque 3380 ft-lb | **PASS** | Constant-speed prop governor verified |
| **GATE-F-01** | Shared Core | Cross-system catalog namespace isolation | Integration / Security | Drone, Auto, and Aero engine ID sets must be completely disjoint | `assert drone_ids.isdisjoint(auto_ids)` and disjoint with aero_ids | **PASS** | 0 ID collisions across 3 systems |
| **GATE-F-02** | Auto | Cross-system boundary: Auto rejects Aero engine | Integration / Security | Querying an Aero engine ID on `/api/v1/auto/catalog` returns 404 | HTTP 404 Not Found returned cleanly | **PASS** | `{"detail":"Engine 'AERO-CFM-CFM56-7B' not found"}` |
| **GATE-F-03** | Aero | Cross-system boundary: Aero rejects Auto engine | Integration / Security | Querying an Auto engine ID on `/api/v1/aero/catalog` returns 404 | HTTP 404 Not Found returned cleanly | **PASS** | `{"detail":"Engine 'AUTO-M177-4.0V8' not found"}` |
| **GATE-G-01** | Auto | Negative throttle boundary rejection | Integration / Validation | Negative throttle rejected with HTTP 422 Unprocessable Entity | HTTP 422 returned with validation error | **PASS** | Input validation bounds `0.0 <= throttle <= 1.0` |
| **GATE-G-02** | Aero | Invalid time-step dt_s rejection | Integration / Validation | `dt_s <= 0` rejected with HTTP 422 Unprocessable Entity | HTTP 422 returned with validation error | **PASS** | Input validation bounds `dt_s > 0.0` enforced |

---

## 2. Unit & Domain Test Matrix

| Subsystem | Suite Path | Tests | Passing | Failing | Coverage Highlights | Status |
|---|---|---|---|---|---|---|
| **Aero Physics** | `tests/aero_engine/test_turbofan.py` | 14 | 14 | 0 | CFM56 Brayton cycle, dual-spool inertia, ISA lapse, EGT acceleration spikes | **PASS** |
| **Aero Physics** | `tests/aero_engine/test_turboprop.py` | 12 | 12 | 0 | PT6A free turbine, constant-speed prop governor, flat rating | **PASS** |
| **Aero Physics** | `tests/aero_engine/test_piston_aero.py` | 10 | 10 | 0 | Lycoming IO-360 Otto cycle, CHT/EGT mixture leaning | **PASS** |
| **Aero Physics** | `tests/aero_engine/test_turbojet.py` | 10 | 10 | 0 | J85 single spool, afterburner augmentation, thrust-to-weight | **PASS** |
| **Aero Catalog** | `tests/aero_engine/test_aero_catalog.py` | 16 | 16 | 0 | 11 FAA/EASA certified engines, provenance schemas, operating limits | **PASS** |
| **Aero Scenarios**| `tests/aero_engine/test_scenarios.py` | 14 | 14 | 0 | Takeoff, climb, cruise, descent, fault injection timeline | **PASS** |
| **Auto Simulation**| `tests/auto_engine/test_simulator.py` | 18 | 18 | 0 | SI 4-stroke cycle, indicated work, friction, pumping, thermal inertia | **PASS** |
| **Auto Dyno** | `tests/auto_engine/test_dyno.py` | 12 | 12 | 0 | Wide-open throttle sweep, peak power/torque correlation | **PASS** |
| **Auto Tuning** | `tests/auto_engine/test_tuning.py` | 14 | 14 | 0 | Boost, timing advance, AFR feasibility, knock detection | **PASS** |
| **Auto Reliability**| `tests/auto_engine/test_reliability.py` | 12 | 12 | 0 | Arrhenius thermal wear, Miner fatigue damage, Weibull RUL | **PASS** |
| **Drone Twin** | `tests/test_piston_model.py` | 15 | 15 | 0 | Rotax 914 F digital twin, turbocharger wastegate, intercooler | **PASS** |
| **Drone Health** | `tests/test_health_assessment.py` | 14 | 14 | 0 | Random Forest & rule-based anomaly classifier, fault scores | **PASS** |
| **Total Pytest** | Full Suite | **179** | **179** | **0** | **100% of collected tests passed in 36.34 seconds** | **PASS** |

---

## 3. Frontend Static Analysis & Production Build Matrix

| Check | Target | Tool / Command | Result | Status |
|---|---|---|---|---|
| **TypeScript Type Check** | `frontend/src/**/*.ts(x)` | `tsc --noEmit` | 0 type errors | **PASS** |
| **Vite Production Bundler** | `frontend/src` -> `frontend/dist` | `vite build` | 2450 modules transformed, build generated in 7.74s | **PASS** |
| **HTML Shell Integrity** | `frontend/dist/index.html` | Build validator | Title, meta tags, root mounting div verified | **PASS** |
| **CSS Bundle Integrity** | `frontend/dist/assets/*.css` | CSS validator | 153.11 kB (gzip: 20.29 kB) zero syntax errors | **PASS** |
| **JS Chunk Integrity** | `frontend/dist/assets/*.js` | Rollup bundle analyzer | 2,313.54 kB (gzip: 592.41 kB) zero unresolved imports | **PASS** |

---

## 4. End-to-End Browser Subagent Verification Matrix

| Workflow ID | Path | User Action Tested | Visual & Functional Verification | Status |
|---|---|---|---|---|
| **BROWSER-01** | `/select-engine` | Open landing page | Renders 3 domain hero cards: Dhruva Drone, Dhruva Auto, Dhruva Aero with live status indicators and navigation links. | **PASS** |
| **BROWSER-02** | `/aero/dashboard` | Click "Launch Aero Digital Twin" | Direct navigation to `/aero/dashboard`; 3D procedural engine renders in Three.js; FADEC flight regime banner displays cruise state; live telemetry updates. | **PASS** |
| **BROWSER-03** | `/dashboard` | Navigate to Drone Twin | Direct navigation to `/dashboard`; Digital Twin HUD renders with HUD instruments, live gauges, AI Copilot status matrix, and engine status indicators. | **PASS** |
| **BROWSER-04** | `/auto/dashboard` | Navigate to Auto Twin | Direct navigation to `/auto/dashboard`; automotive powertrain telemetry cards render with 11-engine selector, RPM gauge, brake HP, and torque graphs. | **PASS** |
