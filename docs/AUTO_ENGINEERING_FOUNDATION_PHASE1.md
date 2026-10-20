# Dhruva Auto Engineering Foundation — Phase 1 Documentation

**Module Designation:** `auto_engine` / `backend.app.api.auto`  
**Status:** Implemented & Verified (107/107 Tests Passing)  
**Classification:** Phase 1 Multi-Domain Engineering Foundation  

---

## 1. Executive Summary & Architecture Audit

The **Dhruva Auto Engineering Foundation** extends the Dhruva platform into a multi-domain engine simulation, tuning, and monitoring platform supporting:
1. **Automobile Propulsion Systems** (High-performance internal combustion engines & hybrid powertrains)
2. **Drone / UAV Propulsion Systems** (MALE UAV aero-piston heavy-fuel & gasoline engines)
3. **Aeroplane Propulsion Systems** (Commercial & defense aviation turboprops & turbofans)

### Architectural Audit & Preservation
- **Existing Architecture Preserved:** All existing drone digital twin components (`digital_twin/`, `simulation/`, `data/generators/`, `backend/app/api/`) remain 100% backward-compatible.
- **Zero Breakages:** The original 77 drone tests continue to pass without regression.
- **Modular Decoupling:** The new multi-domain simulation and catalog architecture is organized under the clean `auto_engine` package and exposed through `/api/auto/*` in the FastAPI backend.

```
                           DHRUVA UNIFIED PLATFORM
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          ▼                           ▼                           ▼
    DRONE ENGINES            AUTOMOBILE ENGINES          AEROPLANE ENGINES
 (Rotax / Lycoming / AE)     (EA888 / B58 / M177)         (PT6A Turboprop)
          │                           │                           │
          └───────────────────────────┼───────────────────────────┘
                                      ▼
                      auto_engine (Phase 1 Foundation)
               ├── catalog/     (Structured Registry & Provenance)
               ├── physics/     (First-Principles Thermodynamic Core)
               ├── simulation/  (Deterministic Integrator & Dyno Bench)
               └── telemetry/   (Integrity Schema & Provenance Labels)
                                      │
                                      ▼
                      backend/app/api/auto.py (REST API)
```

---

## 2. Engine Catalog & Data Provenance

The catalog strictly distinguishes **verified manufacturer specifications** from **empirical estimates** or **simulation baseline defaults**. Data provenance is stamped on every parameter group with source document citations.

### Provenance Levels
- `VERIFIED_MANUFACTURER_SPEC`: Extracted directly from official OEM Type Certificate Data Sheets (FAA / EASA), manufacturer technical service training manuals, or homologation certificates.
- `CALCULATED_ENGINEERING_METRIC`: Derived using exact mathematical relationships (e.g. swept volume from bore and stroke: $V_d = \frac{\pi}{4} b^2 s \cdot n_{cyl}$, or power from torque $\times$ speed).
- `ESTIMATED_EMPIRICAL_CORRELATION`: Physical empirical models (e.g. Heywood Chen-Flynn friction mean effective pressure, lumped thermal capacitances).
- `SYNTHETIC_SIMULATION_DEFAULT`: Representative baseline coefficients for non-certified demonstration.

### Registered Benchmark Engines

| Engine ID | Name | Domain | Type / Aspiration | Rated Power | Peak Torque | Redline | Data Provenance Citation |
|---|---|---|---|---|---|---|---|
| `AUTO-EA888-2.0T` | VW EA888 Gen 3 2.0 TSI | Automobile | I4 Turbo Gasoline | 162 kW @ 6200 RPM | 350 Nm @ 1500–4400 RPM | 6800 RPM | VAG Self-Study Programme 606 & Directive 80/1269/EEC |
| `AUTO-B58-3.0T` | BMW B58B30M0 3.0L Turbo | Automobile | I6 Turbo Gasoline | 250 kW @ 6500 RPM | 500 Nm @ 1520–4500 RPM | 7000 RPM | BMW Service Training ST1501 |
| `AUTO-M177-4.0V8` | Mercedes-AMG M177 4.0L Bi-Turbo | Automobile | V8 Twin-Turbo Gasoline | 375 kW @ 6250 RPM | 700 Nm @ 1750–4500 RPM | 7200 RPM | Daimler AG M177 Introduction Manual |
| `DRONE-ROTAX-914` | Rotax 914 F/UL | Drone UAV | Boxer-4 Turbo AVGAS | 84.5 kW @ 5800 RPM | 144 Nm @ 4900 RPM | 5800 RPM | EASA TCDS No. E.122 / BRP-Rotax OM-914 |
| `DRONE-LYCOMING-O320` | Lycoming O-320-D2A | Drone UAV | Boxer-4 NA AVGAS | 119 kW @ 2700 RPM | 420 Nm @ 2200 RPM | 2700 RPM | FAA TCDS No. E-274 |
| `DRONE-AUSTRO-AE300` | Austro Engine AE300 (E4) | Drone UAV | I4 Turbo Jet-A1/Diesel | 123.5 kW @ 3880 RPM | 560 Nm @ 2500 RPM | 3900 RPM | EASA TCDS No. E.200 |
| `AERO-PT6A-67A` | P&WC PT6A-67A Turboprop | Aeroplane | Turboprop Jet-A1 | 895 kW @ 1700 Prop RPM | 4970 Nm (Shaft) | 1800 RPM | Transport Canada TCDS E-16 / FAA E4EA |

---

## 3. Physics-Based Deterministic Simulation Backend

The simulation core implements explicit, unit-verified differential equations for continuous engine states:

### 3.1 Atmospheric Conditions & Speed-Density Airflow
- **ISA Atmospheric Model:**
  $$T_{amb}(h) = T_0 - L \cdot h, \quad P_{amb}(h) = P_0 \left(\frac{T_{amb}}{T_0}\right)^{\frac{g}{R L}}, \quad \rho_{amb} = \frac{P_{amb}}{R \cdot T_{amb}}$$
  Where $L = 0.0065 \text{ K/m}$, $R = 287.058 \text{ J/(kg}\cdot\text{K)}$.
- **Intake Manifold Absolute Pressure (MAP):**
  $$P_{map} = P_{amb} \cdot \left[c_{idle} + (1 - c_{idle}) \cdot u_{th}^{1.12}\right] + P_{boost}$$
- **Turbocharger Spool & Wastegate Dynamics:**
  $$\tau_{turbo} \frac{dP_{boost}}{dt} = P_{boost,target} - P_{boost}$$
  $$P_{boost,target} = P_{boost,max} \cdot \left(\frac{\text{RPM} - \text{RPM}_{spool}}{\text{RPM}_{rated} - \text{RPM}_{spool}}\right)^{1.15} \cdot f_{taper}(\text{RPM}) \cdot u_{th}$$
  Where $f_{taper}(\text{RPM})$ models electronic wastegate duty-cycle reduction above $0.68 \cdot \text{RPM}_{rated}$ to cap high-RPM cylinder pressure at rated power.
- **Speed-Density Air Mass Flow:**
  $$\dot{m}_{air} = \frac{V_d \cdot \text{RPM}}{120} \cdot \frac{P_{map}}{R \cdot T_{intake}} \cdot \eta_v(\text{RPM})$$
  Where $\eta_v(\text{RPM}) = \eta_{v,peak} \left[1 - k \left(\frac{\text{RPM} - N_{torque}}{1000}\right)^2\right]$.

### 3.2 Combustion, Fuel Flow & Indicated Work
- **Fuel Mass Flow:**
  $$\dot{m}_{fuel} = \frac{\dot{m}_{air}}{\text{AFR}_{target}}, \quad \dot{V}_{fuel} = \frac{\dot{m}_{fuel}}{\rho_{fuel}} \cdot 3600 \text{ [L/h]}$$
- **Air-Standard Indicated Thermal Efficiency:**
  $$\eta_{ideal} = 1 - \frac{1}{r_c^{\gamma - 1}}, \quad \eta_{ind} = \eta_{ideal} \cdot \eta_{comb} \cdot f_{speed}(\text{RPM})$$
- **Indicated Power, Torque & IMEP:**
  $$P_{ind} = \dot{m}_{fuel} \cdot Q_{LHV} \cdot \eta_{ind}, \quad T_{ind} = \frac{P_{ind}}{\omega}, \quad \text{IMEP} = \frac{P_{ind} \cdot 120}{V_d \cdot \text{RPM}}$$

### 3.3 Friction, Brake Output & Rotational Dynamics
- **Chen-Flynn Friction Mean Effective Pressure (FMEP):**
  $$\text{FMEP} = C_0 + C_1 \left(\frac{\text{RPM}}{1000}\right) + C_2 \left(\frac{\text{RPM}}{1000}\right)^2 + C_3 \cdot \text{IMEP}$$
  $$T_{fric} = \frac{\text{FMEP} \cdot V_d}{4\pi}, \quad T_{brake} = T_{ind} - T_{fric}, \quad P_{brake} = T_{brake} \cdot \omega$$
- **Brake Specific Fuel Consumption (BSFC):**
  $$\text{BSFC} = \frac{\dot{m}_{fuel} \cdot 3.6 \times 10^6}{P_{brake,kW}} \text{ [g/(kW}\cdot\text{h)]}$$
- **Rotational Inertia Integration:**
  $$I \frac{d\omega}{dt} = T_{brake} - T_{load}$$
  $$\omega(t + \Delta t) = \omega(t) + \frac{T_{brake} - T_{load}}{I} \Delta t$$
- **Enforced Safety Bounds:**
  - *Rev Limiter:* Instantaneous fuel cut-off when $\text{RPM} \ge \text{RPM}_{redline}$, bounding overspeed to $\le \text{RPM}_{redline} + 25 \text{ RPM}$.
  - *Idle Speed Governor (IAC):* Closed-loop throttle augmentation and recovery torque when $\text{RPM} < \text{RPM}_{idle}$.

### 3.4 Lumped Thermal Capacitance & Lubrication
- **Heat Rejection Partitioning:**
  $$\dot{Q}_{reject} = \dot{Q}_{fuel} - P_{ind}$$
  $$\dot{Q}_{exh} = 0.50 \dot{Q}_{reject}, \quad \dot{Q}_{cool} = 0.36 \dot{Q}_{reject}, \quad \dot{Q}_{oil} = 0.10 \dot{Q}_{reject} + P_{fric}$$
- **Coolant & Oil Temperature Integration:**
  $$C_{cool} \frac{dT_{cool}}{dt} = \dot{Q}_{cool} - U_{rad} (T_{cool} - T_{amb}) \cdot f_{thermostat}(T_{cool})$$
  $$C_{oil} \frac{dT_{oil}}{dt} = \dot{Q}_{oil} - U_{oil\_hx} (T_{oil} - T_{cool}) - h_{sump} (T_{oil} - T_{amb})$$
  $$T_{egt} = T_{amb} + \frac{\dot{Q}_{exh}}{\dot{m}_{exh} c_{p,exh}}, \quad T_{cht} = T_{cool} + \Delta T_{head}(load)$$
- **Vogel Oil Kinematic Viscosity & Pressure Delivery:**
  $$\nu(T_{oil}) = A \cdot \exp\left(\frac{B}{T_{oil} + C}\right) \text{ [cSt]}$$
  $$P_{oil} = \min\left(P_{unregulated}\left(\text{RPM}, \nu\right), P_{relief\_max}\right)$$

---

## 4. Telemetry Integrity & Provenance Standards

Telemetry generated by the simulation engine adheres strictly to the canonical schema:
- **`is_synthetic: true`:** Explicitly set on all simulation records; synthetic values are never represented as real sensor measurements.
- **Physical Engineering Units:** Stamped on all outputs (`RPM`, `N*m`, `kW`, `HP`, `L/h`, `g/(kW*h)`, `kPa`, `bar`, `deg C`, `kg`).
- **Channel Provenance Mapping:** Every record includes an explicit channel-to-provenance dictionary:
  - `MEASURED`: Commanded input signals (e.g. `throttle_pct`).
  - `SIMULATED`: Direct dynamic states (e.g. `rpm`, `coolant_temp_c`, `oil_temp_c`, `manifold_pressure_kpa`, `oil_pressure_bar`).
  - `CALCULATED`: Algebraic state derivatives (e.g. `brake_torque_nm`, `brake_power_kw`, `bsfc_g_kwh`, `fuel_flow_lph`).

---

## 5. REST API Specifications

All endpoints are hosted under `/api/auto` and `/api/v1/auto`:

| Endpoint | Method | Description |
|---|---|---|
| `/api/auto/catalog` | `GET` | Retrieve complete list of registered engines with specifications, limits, assumptions, and provenance. |
| `/api/auto/catalog/{engine_id}` | `GET` | Retrieve full technical specifications and provenance for a single engine. |
| `/api/auto/catalog/types/{type}` | `GET` | Filter catalog by domain type (`AUTOMOBILE`, `DRONE_UAV`, `AEROPLANE`). |
| `/api/auto/telemetry/channels` | `GET` | Retrieve canonical telemetry channel dictionary with units and provenance classifications. |
| `/api/auto/simulate/step` | `POST` | Execute single deterministic physics simulation step with verified telemetry return. |
| `/api/auto/simulate/run` | `POST` | Execute sequential time-series batch simulation over a prescribed drive/duty cycle. |
| `/api/auto/simulate/dyno-sweep` | `POST` | Run automated WOT dynamometer test sweep from idle to redline, returning torque/power curves and BSFC map. |
| `/api/auto/health` | `GET` | Subsystem health status of the Dhruva Auto Engineering Foundation module. |

---

## 6. Automated Test Results Summary

Executed test suite using pytest across existing and new modules:

```
============================= test session starts =============================
platform win32 -- Python 3.13.6, pytest-9.1.1, pluggy-1.6.0
collected 107 items

tests/auto_engine/test_auto_api.py .........                             [  8%]
tests/auto_engine/test_catalog.py ......                                 [ 14%]
tests/auto_engine/test_physics_equations.py .........                    [ 22%]
tests/auto_engine/test_simulation_determinism.py ....                    [ 26%]
tests/auto_engine/test_telemetry_provenance.py ..                        [ 28%]
tests/backend/test_api.py ........................                       [ 50%]
tests/digital_twin/test_health.py ........                               [ 57%]
tests/digital_twin/test_residuals.py .....                               [ 62%]
tests/digital_twin/test_state.py ...                                     [ 65%]
tests/digital_twin/test_validity.py ...                                  [ 68%]
tests/integration/test_pipeline.py ..                                    [ 70%]
tests/ml/test_models.py .............                                   [ 82%]
tests/simulation/test_engines.py ..                                     [ 84%]
tests/simulation/test_export.py ..                                      [ 86%]
tests/simulation/test_faults.py .....                                    [ 90%]
tests/simulation/test_generator.py ..                                   [ 92%]
tests/simulation/test_missions.py .                                      [ 93%]
tests/simulation/test_schema.py ..                                      [ 95%]
tests/twin/test_twin_engine.py .....                                     [100%]

======================= 107 passed, 3 warnings in 30.31s =======================
```

- **Pass Rate:** 100% (107/107 passed).
- **Existing Drone Suite Regressions:** 0.
- **New Foundation Tests:** 30 passed covering catalog, equations, determinism, limits, telemetry integrity, and REST endpoints.

---

## 7. Known Limitations & Phase 2 Integration Roadmap

### Current Phase 1 Scope & Known Limitations
1. **Simplified 0D/1D Thermodynamic Cycle:** Uses lumped-parameter mean-value engine models (MVEM) rather than 3D CFD crank-angle resolved combustion modeling.
2. **Fixed Thermal Ambient Coupling:** Radiator air mass flow scales with road/air speed estimation rather than active aerodynamic shutter positioning.
3. **Phase 1 Boundary:** Advanced AI anomaly detection, RUL degradation models, and 3D digital twin mesh views for automotive engines are explicitly deferred to Phase 2 per specification.

### Recommended Phase 2 Integration Points
1. **Frontend Dedicated Automotive Dashboard:** Wire `/api/auto/simulate/dyno-sweep` and real-time step streaming into the Automobile card on the landing page.
2. **Multi-Domain Digital Twin Residual Estimator:** Instantiate real-time twin observers comparing simulated automotive expected telemetry against CAN FD / OBD-II logs.
3. **Automotive Drive-Cycle Library:** Add standardized WLTP, EPA FTP-75, and track endurance drive-cycle runners into `auto_engine/simulation/`.
4. **Hardware CAN / OBD-II Ingestion Pipeline:** Connect WebSocket streaming (`/ws/telemetry/auto`) to live automotive telemetry feeds with automatic provenance tagging as `MEASURED`.
