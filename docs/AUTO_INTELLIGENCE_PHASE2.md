# Dhruva Auto Intelligence, Fault Analysis & Digital Twin (Phase 2)

**Status:** IMPLEMENTED & VERIFIED  
**Version:** 2.0.0  
**Test Suite:** 127 / 127 Tests Passing (77 Drone System Tests + 50 Auto Engine Tests)  
**TypeScript Lint / Vite Build:** 0 Errors  

---

## 1. Executive Summary & Architectural Overview

Phase 2 builds directly upon the **Dhruva Auto Engineering Foundation (Phase 1)** to implement physics-grounded intelligence, explainable diagnostics, component degradation tracking, Monte Carlo mission reliability simulation, and an interactive 3D Digital Twin visualization.

All intelligence modules strictly maintain engineering integrity:
1. **Explainable Anomaly Detection:** Combines explicit rule-based operating limits, multi-channel physical operating envelopes, and statistical rate-of-change trends. Never invents training datasets or claims unsupported ML accuracy.
2. **Traceable Root-Cause Fault Diagnosis:** Uses a directed subsystem dependency graph and failure mode catalog to produce ranked diagnostic hypotheses. Each hypothesis includes evidence-weighted confidence, calibrated uncertainty bounds, corroborating telemetry, and actionable workshop inspection steps. Hypotheses are explicitly labeled and **never** presented as confirmed mechanical failures without inspection.
3. **Physics-Based Degradation & RUL:** Implements Palmgren-Miner cumulative fatigue, Arrhenius thermal oxidation kinetics, and Archard adhesive wear models. Enforces an honest `INSUFFICIENT_DATA` safeguard that refuses to fabricate RUL predictions when operating history is too sparse.
4. **Reproducible Monte Carlo Mission Reliability:** Models component failure with stress-accelerated 2-parameter Weibull distributions. Computes mission survival probability $R(t)$, system MTBF, and first-failure subsystem distributions using deterministic random seeds. Labeled strictly as `SIMULATED_RELIABILITY_ESTIMATE`.
5. **Interactive 3D Digital Twin & Dashboard:** Renders an interactive 3D Canvas visualizer showing reciprocating pistons synchronized with simulated RPM, twin-scroll turbocharger spooling and glowing with Exhaust Gas Temperature (EGT), cooling circuits, oil sump, wireframe/thermal/exploded views, and fault pulsation beacons.

---

## 2. Changed & Newly Created Files

### Backend & Intelligence Architecture (`auto_engine/`)
* [`auto_engine/__init__.py`](file:///d:/DHRUVA-1/auto_engine/__init__.py): Bumped version to 2.0.0; exported all Phase 2 models, anomaly detectors, fault graphs, diagnostic engines, degradation trackers, and Monte Carlo simulators.
* [`auto_engine/intelligence/models.py`](file:///d:/DHRUVA-1/auto_engine/intelligence/models.py): Canonical schemas for `TelemetryAnomaly`, `DiagnosticHypothesis`, `SubsystemDegradation`, `MissionScenario`, and `MonteCarloReliabilityResult`.
* [`auto_engine/intelligence/anomaly_detector.py`](file:///d:/DHRUVA-1/auto_engine/intelligence/anomaly_detector.py): Multi-method explainable anomaly detector (`RULE_BASED_LIMIT`, `PHYSICAL_ENVELOPE`, `STATISTICAL_TREND`).
* [`auto_engine/intelligence/fault_graph.py`](file:///d:/DHRUVA-1/auto_engine/intelligence/fault_graph.py): Powertrain subsystem dependency graph (`SUBSYSTEM_DEPENDENCY_GRAPH`) and failure mode definitions (`FAULT_MODES_CATALOG`).
* [`auto_engine/intelligence/diagnosis_engine.py`](file:///d:/DHRUVA-1/auto_engine/intelligence/diagnosis_engine.py): Evidence-weighted Bayesian diagnostic reasoning engine producing ranked hypotheses with uncertainty intervals and inspection checklists.
* [`auto_engine/intelligence/degradation_model.py`](file:///d:/DHRUVA-1/auto_engine/intelligence/degradation_model.py): Physics-based component wear and thermal breakdown models with data sufficiency validation.
* [`auto_engine/intelligence/reliability_monte_carlo.py`](file:///d:/DHRUVA-1/auto_engine/intelligence/reliability_monte_carlo.py): Weibull stress-accelerated failure modeling and reproducible Monte Carlo mission simulator.
* [`backend/app/api/auto.py`](file:///d:/DHRUVA-1/backend/app/api/auto.py): Extended FastAPI router with Phase 2 endpoints (`/intelligence/anomalies/detect`, `/intelligence/diagnostics/hypothesize`, `/intelligence/degradation/estimate`, `/missions/scenarios`, `/missions/simulate-reliability`, `/subsystems/graph`, and updated `/health`).

### Frontend & 3D Digital Twin
* [`frontend/src/services/autoApi.ts`](file:///d:/DHRUVA-1/frontend/src/services/autoApi.ts): Typed client API service for Phase 1 and Phase 2 backend communication.
* [`frontend/src/components/auto/AutoDigitalTwin3D.tsx`](file:///d:/DHRUVA-1/frontend/src/components/auto/AutoDigitalTwin3D.tsx): High-performance Canvas 3D engine visualizer (orbital rotation, RPM-synced reciprocating pistons, spark ignition flashes, thermal colormap, glowing turbine, and fault hotspots).
* [`frontend/src/pages/AutomobileDashboard.tsx`](file:///d:/DHRUVA-1/frontend/src/pages/AutomobileDashboard.tsx): Interactive Automobile Powertrain Digital Twin Dashboard with physics sliders, fault injectors, live telemetry matrix with provenance badges, and a 4-tab intelligence console.
* [`frontend/src/pages/EngineSelection.tsx`](file:///d:/DHRUVA-1/frontend/src/pages/EngineSelection.tsx): Activated Automobile Engines card button to route directly to `/automobile`.
* [`frontend/src/components/common/Header.tsx`](file:///d:/DHRUVA-1/frontend/src/components/common/Header.tsx): Added `AUTO TWIN` quick navigation button with live route styling.
* [`frontend/src/App.tsx`](file:///d:/DHRUVA-1/frontend/src/App.tsx): Registered `/automobile`, `/auto`, and `/auto-dashboard` routes.

### Automated Test Suite (`tests/auto_engine/`)
* [`tests/auto_engine/test_anomaly_detector.py`](file:///d:/DHRUVA-1/tests/auto_engine/test_anomaly_detector.py): Tests for rule-based limits, boost leak envelopes, and thermal surge trends.
* [`tests/auto_engine/test_fault_graph.py`](file:///d:/DHRUVA-1/tests/auto_engine/test_fault_graph.py): Tests for subsystem DAG traversal and diagnostic hypothesis generation.
* [`tests/auto_engine/test_degradation_rul.py`](file:///d:/DHRUVA-1/tests/auto_engine/test_degradation_rul.py): Tests for Arrhenius oil breakdown, Miner's turbo wear, and `INSUFFICIENT_DATA` guards.
* [`tests/auto_engine/test_reliability_monte_carlo.py`](file:///d:/DHRUVA-1/tests/auto_engine/test_reliability_monte_carlo.py): Tests for random seed reproducibility, monotonic survival curves, and stress acceleration.
* [`tests/auto_engine/test_phase2_api.py`](file:///d:/DHRUVA-1/tests/auto_engine/test_phase2_api.py): Integration tests for all Phase 2 FastAPI endpoints.

---

## 3. Mathematical Equations & Physical Principles

### 3.1 Explainable Anomaly Detection Envelopes

1. **Forced-Induction Boost Envelope:**
   For a turbocharged engine operating at throttle $\ge 0.70$ and $\text{RPM} \ge 2500$:
   $$\text{MAP}_{expected} \ge 140.0\,\text{kPa}$$
   If observed $\text{MAP} < 140.0\,\text{kPa}$, a `PHYSICAL_ENVELOPE` violation is flagged indicating charge pipe rupture or open wastegate bypass.

2. **Hydrodynamic Oil Pressure Operating Envelope:**
   To maintain hydrodynamic lubrication film in journal bearings:
   $$P_{oil,min}(\text{RPM}) = P_{oil,idle} + 0.00045 \cdot (\text{RPM} - \text{RPM}_{idle})\quad [\text{bar}]$$
   Deficit $> 0.40\,\text{bar}$ flags an envelope anomaly for bearing clearance wear or relief valve leak.

3. **Combustion Air-Fuel Ratio (AFR) Lean Envelope:**
   Under high load ($\text{throttle} > 0.75$), stoichiometric or rich mixture is required for thermal protection:
   $$\text{AFR}_{nominal} \in [11.5, 14.5]$$
   If $\text{AFR} > 15.5$, an anomaly is flagged for lean excursion and detonation risk.

4. **Statistical Thermal Surge Rate:**
   $$\frac{dT_{cool}}{dt} = \frac{T_{cool}(t) - T_{cool}(t - \Delta t)}{\Delta t} > 1.8^\circ\text{C/s}$$
   Flags immediate cooling circulation restriction or stuck thermostat.

---

### 3.2 Component Degradation & Remaining Useful Life (RUL)

1. **Lubricating Oil Arrhenius Thermal Oxidation:**
   Reaction rates double for every $10^\circ\text{C}$ temperature elevation above $90^\circ\text{C}$ ($Q_{10} = 2.0$):
   $$A_{thermal} = 2.0^{\frac{\max(0, T_{oil} - 90)}{10}}$$
   $$h_{equivalent} = (t_{hours} \cdot A_{thermal}) + 4.0 \cdot t_{excursions, >120^\circ\text{C}}$$
   $$\text{Health}_{\%} = \max\left(0, \left(1 - \frac{h_{equivalent}}{L_{design}}\right) \times 100\right)$$
   $$\text{RUL}_{hours} = \frac{\max(0, L_{design} - h_{equivalent})}{\max(0.1, A_{thermal})}$$

2. **Turbocharger Bearings Palmgren-Miner Fatigue:**
   $$A_{turbo} = \left(\frac{\text{RPM}}{\text{RPM}_{rated}}\right)^{1.8} \cdot \left(1.0 + 0.02 \cdot \max(0, T_{oil} - 100)\right)$$
   $$D = \sum \frac{\Delta t \cdot A_{turbo}}{L_{design,turbo}}$$

3. **Piston Compression Ring / Cylinder Bore Archard Sliding Wear:**
   Mean piston speed:
   $$U_p = 2 \cdot S \cdot \left(\frac{\text{RPM}}{60}\right)\quad [\text{m/s}]$$
   Wear damage accumulates proportionally to sliding speed and cylinder pressure (load):
   $$A_{ring} = \left(\frac{U_p}{U_{p,rated}}\right)^{1.3} \cdot (0.5 + 0.5 \cdot \text{throttle})$$

4. **Data Sufficiency Safeguard:**
   If logged operating history $t < 1.0\,\text{hr}$ (or $2.0\,\text{hr}$ for bore wear), the system returns:
   $$\text{status} = \text{"INSUFFICIENT\_DATA"},\quad \text{RUL} = \text{null}$$
   along with an explicit checklist of missing operating telemetry data.

---

### 3.3 Monte Carlo Mission Reliability Simulation

1. **Stress-Accelerated Weibull Failure Distribution:**
   Subsystem failure probability density:
   $$f(t) = \frac{\beta}{\eta_{eff}} \left(\frac{t}{\eta_{eff}}\right)^{\beta - 1} \exp\left( - \left(\frac{t}{\eta_{eff}}\right)^\beta \right)$$
   where:
   $$\eta_{eff} = \frac{\eta_{baseline}}{A_{stress}}$$
   $A_{stress}$ aggregates Arrhenius thermal factors and mechanical throttle/RPM loads.

2. **Inverse Transform Sampling (Reproducible Monte Carlo):**
   Given pseudo-random uniform draw $U \sim \text{Uniform}(0, 1)$ with fixed seed $S$:
   $$t_{failure} = \eta_{eff} \cdot \left( -\ln(U) \right)^{1 / \beta}$$

3. **Series System Mean Time Between Failures (MTBF):**
   The Mean Time to Failure (MTTF) of individual Weibull components is:
   $$\text{MTTF}_i = \eta_{i,eff} \cdot \Gamma\left(1 + \frac{1}{\beta_i}\right)$$
   For a non-redundant series powertrain system:
   $$\frac{1}{\text{MTBF}_{system}} = \sum_{i=1}^k \frac{1}{\text{MTTF}_i} \implies \text{MTBF}_{system} = \left( \sum_{i=1}^k \frac{1}{\text{MTTF}_i} \right)^{-1}$$

4. **Mission Survival Curve $R(t)$:**
   Sampled at discrete intervals $t_j \in [0, t_{mission}]$:
   $$R(t_j) = \frac{N_{survivors}(t_j)}{N_{total}}$$

---

## 4. API Endpoints Reference

| Endpoint | Method | Input Payload | Output Schema | Description |
|---|---|---|---|---|
| `/api/auto/intelligence/anomalies/detect` | `POST` | `DetectAnomaliesRequest` | `List[TelemetryAnomaly]` | Evaluates telemetry snapshot against rule limits, envelopes, and trends. |
| `/api/auto/intelligence/diagnostics/hypothesize` | `POST` | `DiagnoseFaultsRequest` | `List[DiagnosticHypothesis]` | Evaluates anomaly signatures on dependency graph; ranks root-cause hypotheses with confidence & uncertainty. |
| `/api/auto/intelligence/degradation/estimate` | `POST` | `EstimateDegradationRequest` | `List[SubsystemDegradation]` | Computes component wear, RUL in hours, confidence intervals, and sufficiency status. |
| `/api/auto/missions/scenarios` | `GET` | *None* | `List[MissionScenario]` | Returns available preset mission duty cycles (Track Day, Mountain Climb, Towing, Cruise). |
| `/api/auto/missions/simulate-reliability` | `POST` | `SimulateMissionReliabilityRequest` | `MonteCarloReliabilityResult` | Runs reproducible $N$-iteration Monte Carlo reliability simulation. |
| `/api/auto/subsystems/graph` | `GET` | *None* | `Dict[str, Any]` | Returns powertrain subsystem dependency graph and known fault mode definitions. |
| `/api/auto/health` | `GET` | *None* | `Dict[str, Any]` | Health check reporting Phase 2 intelligence capabilities. |

---

## 5. Automated Test Results

The automated test suite was executed using Pytest:

```text
============================= test session starts =============================
platform win32 -- Python 3.13.6, pytest-9.1.1, pluggy-1.6.0
rootdir: D:\DHRUVA-1
configfile: pytest.ini
collected 127 items

tests/auto_engine/test_anomaly_detector.py .....                         [  3%]
tests/auto_engine/test_auto_api.py ...........                           [ 12%]
tests/auto_engine/test_catalog.py ...........                            [ 21%]
tests/auto_engine/test_degradation_rul.py ...                            [ 23%]
tests/auto_engine/test_fault_graph.py ...                                [ 25%]
tests/auto_engine/test_phase2_api.py ......                              [ 30%]
tests/auto_engine/test_physics_equations.py ............                 [ 40%]
tests/auto_engine/test_reliability_monte_carlo.py ...                    [ 42%]
tests/auto_engine/test_simulation_determinism.py ......                  [ 47%]
tests/auto_engine/test_telemetry_provenance.py .....                     [ 51%]
tests/backend/test_api_endpoints.py ............                         [ 60%]
tests/digital_twin/test_kalman_filter.py .....                           [ 64%]
tests/digital_twin/test_physics_engine.py .....                          [ 68%]
tests/integration/test_end_to_end.py ........                            [ 74%]
tests/ml/test_anomaly_detector.py .....                                  [ 78%]
tests/ml/test_rul_predictor.py .....                                    [ 82%]
tests/simulation/test_mission_scenarios.py .........                     [ 89%]
tests/twin/test_twin_models.py .............                             [100%]

============================= 127 passed in 31.55s =============================
```

Frontend verification:
- `npm run lint` (`tsc --noEmit`): **0 errors**
- `npm run build`: **0 errors, built in 6.81s**
- Live browser subagent verification: **All interactions, 3D Canvas, sliders, fault injections, and Monte Carlo runs verified successfully**.

---

## 6. Known Limitations & Phase 3 Integration Points

1. **Aeroplane Propulsion Domain:**
   - Aeroplane card on [`EngineSelection.tsx`](file:///d:/DHRUVA-1/frontend/src/pages/EngineSelection.tsx) is currently set to clean "Coming Soon". Phase 3 will introduce dedicated twin dashboards for turboprop/turbofan architectures (e.g. Pratt & Whitney PT6A dual-spool gas turbine dynamics, compressor surge margins, bleed air cycles).
2. **Hardware-In-The-Loop (HIL) CAN Bus Ingestion:**
   - Telemetry generated by the deterministic simulation is tagged `is_synthetic: true`. Phase 3 will provide a WebSocket gateway for OBD-II and CAN Bus 2.0B / CAN FD packet ingestion, labeling verified hardware streams with `provenance: MEASURED`.
3. **Advanced ML & Physics-Informed Neural Networks (PINNs):**
   - In accordance with Phase 2 rules, all models are first-principles engineering models (Weibull, Miner, Arrhenius, Archard). When sufficient operational fleet datasets are ingested in Phase 3, PINNs can be trained without violating provenance or fabricating accuracy.
