from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Flowable,
    PageBreak,
    Paragraph,
    Preformatted,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs" / "DHRUVA_project_overview.pdf"


class SectionRule(Flowable):
    def __init__(self, width=170 * mm, color=colors.HexColor("#28b7c7")):
        super().__init__()
        self.width = width
        self.height = 4
        self.color = color

    def draw(self):
        self.canv.setStrokeColor(self.color)
        self.canv.setLineWidth(1.2)
        self.canv.line(0, 2, self.width, 2)


def build_styles():
    base = getSampleStyleSheet()
    return {
        "cover_title": ParagraphStyle(
            "CoverTitle", parent=base["Title"], fontName="Helvetica-Bold",
            fontSize=31, leading=36, textColor=colors.white, alignment=TA_CENTER,
            spaceAfter=12,
        ),
        "cover_subtitle": ParagraphStyle(
            "CoverSubtitle", parent=base["Normal"], fontName="Helvetica",
            fontSize=13, leading=19, textColor=colors.HexColor("#c9edf0"),
            alignment=TA_CENTER, spaceAfter=12,
        ),
        "h1": ParagraphStyle(
            "H1", parent=base["Heading1"], fontName="Helvetica-Bold",
            fontSize=19, leading=23, textColor=colors.HexColor("#123d4a"),
            spaceBefore=10, spaceAfter=7,
        ),
        "h2": ParagraphStyle(
            "H2", parent=base["Heading2"], fontName="Helvetica-Bold",
            fontSize=12.5, leading=16, textColor=colors.HexColor("#146b78"),
            spaceBefore=8, spaceAfter=4,
        ),
        "body": ParagraphStyle(
            "Body", parent=base["BodyText"], fontName="Helvetica",
            fontSize=9.3, leading=13.5, textColor=colors.HexColor("#263238"),
            spaceAfter=6,
        ),
        "small": ParagraphStyle(
            "Small", parent=base["BodyText"], fontName="Helvetica",
            fontSize=7.8, leading=10.5, textColor=colors.HexColor("#37474f"),
            spaceAfter=4,
        ),
        "bullet": ParagraphStyle(
            "Bullet", parent=base["BodyText"], fontName="Helvetica",
            fontSize=9.1, leading=13, leftIndent=13, firstLineIndent=-8,
            textColor=colors.HexColor("#263238"), spaceAfter=3,
        ),
        "code": ParagraphStyle(
            "Code", parent=base["Code"], fontName="Courier",
            fontSize=7.7, leading=10.5, textColor=colors.HexColor("#263238"),
        ),
        "footer": ParagraphStyle(
            "Footer", parent=base["Normal"], fontName="Helvetica",
            fontSize=7, textColor=colors.HexColor("#607d8b"), alignment=TA_CENTER,
        ),
    }


def p(text, style):
    return Paragraph(text, style)


def bullets(items, style):
    return [p("&#8226; " + item, style) for item in items]


def table(rows, widths, styles, header=True):
    converted = []
    for row_index, row in enumerate(rows):
        converted.append([
            item if isinstance(item, Flowable) else p(str(item), styles["small"])
            for item in row
        ])
    result = Table(converted, colWidths=widths, repeatRows=1 if header else 0,
                   hAlign="LEFT")
    commands = [
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0e5664")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#b0bec5")),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]
    for row_index in range(1 if header else 0, len(rows)):
        if row_index % 2 == 0:
            commands.append(("BACKGROUND", (0, row_index), (-1, row_index), colors.HexColor("#eef6f7")))
    result.setStyle(TableStyle(commands))
    return result


def header_footer(canvas, document):
    canvas.saveState()
    width, height = A4
    canvas.setStrokeColor(colors.HexColor("#b0bec5"))
    canvas.setLineWidth(0.4)
    canvas.line(18 * mm, 13 * mm, width - 18 * mm, 13 * mm)
    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(colors.HexColor("#607d8b"))
    canvas.drawString(18 * mm, 8 * mm, "DHRUVA project overview | Representative prototype")
    canvas.drawRightString(width - 18 * mm, 8 * mm, f"Page {document.page}")
    canvas.restoreState()


def make_story(styles):
    story = []
    story.append(Spacer(1, 34 * mm))
    story.append(p("DHRUVA", styles["cover_title"]))
    story.append(p("AI-enabled Digital Twin Platform for Aero Piston Engines in MALE UAV Missions", styles["cover_subtitle"]))
    story.append(Spacer(1, 9 * mm))
    story.append(p("Detailed project overview", styles["cover_subtitle"]))
    story.append(Spacer(1, 25 * mm))
    story.append(p("Problem Statement ID: 26054 | Repository branch: Yash | Generated: September 2026", styles["cover_subtitle"]))
    story.append(Spacer(1, 35 * mm))
    story.append(Table([[p("Purpose", styles["h2"]), p("Unify synthetic telemetry, physics-based digital-twin state estimation, machine-learning intelligence, backend services, and an operational frontend into one demonstrable platform.", styles["body"])]], colWidths=[28 * mm, 128 * mm], style=TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#123d4a")),
        ("TEXTCOLOR", (0, 0), (-1, -1), colors.white),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#28b7c7")),
        ("PADDING", (0, 0), (-1, -1), 10),
    ])))
    story.append(PageBreak())

    story.append(p("1. Executive Summary", styles["h1"]))
    story.append(SectionRule())
    story.append(p("DHRUVA is a representative prototype for monitoring the health of aero piston engines used in medium-altitude, long-endurance unmanned aerial vehicle missions. It models expected engine behavior from operating conditions, compares expected values with observed telemetry, converts the resulting residuals into component health and an overall Health Index, and exposes the resulting information to an operational web console.", styles["body"]))
    story.append(p("The repository is organized as a full-stack engineering demonstrator. The root implementation contains Python simulation, digital-twin, machine-learning, backend, database, streaming, agent, and test layers. The React/Vite frontend presents fleet, engine, mission, fault, tuning, and maintenance workflows. Several DHRUVA-* directories are parallel team snapshots or specialized copies; the root folders are the primary integrated surface used by this report.", styles["body"]))
    story.extend(bullets([
        "Phase 1 generates reproducible, labelled synthetic telemetry under configurable engine, mission, environment, sensor-noise, and fault conditions.",
        "Phase 2 runs telemetry sequentially through a physics-inspired digital twin and produces residuals, validity flags, component health, and a smoothed Health Index.",
        "The ML layer adds cleaning, feature engineering, anomaly detection, fault classification, RUL estimation, sensor-drift detection, trend forecasting, and explainability.",
        "The FastAPI backend provides REST endpoints for engines, telemetry, health, faults, missions, tuning, replay, reports, alerts, subsystems, agent interactions, and fleet monitoring.",
        "WebSockets provide engine-specific or fleet-wide telemetry streams for live frontend updates.",
    ], styles["bullet"]))

    story.append(p("2. Goals, Scope, and Safety Position", styles["h1"]))
    story.append(SectionRule())
    story.append(p("The system is designed to make engine behavior observable and analyzable before real or certified data is available. Its central value is an explainable chain from operating conditions to expected physics, residual evidence, health scoring, and operator-facing action. The project is not presented as an aircraft safety system or as a substitute for certified engine maps, FADEC logic, maintenance procedures, or operational limits.", styles["body"]))
    story.append(table([
        ["In scope", "Out of scope or explicitly limited"],
        ["Synthetic telemetry generation; mission and engine configuration; representative fault injection; data export; physics-inspired residuals; health scoring; optional ML inference; backend APIs; persistence; WebSocket streaming; web console; test fixtures.", "Classified or proprietary DRDO data; certified limits; thermodynamic cycle fidelity; operational aircraft control; production-grade sensor-error characterization; validated maintenance intervals; safety certification."],
        ["Primary users", "Expected decisions"],
        ["Prototype developers, data scientists, backend/frontend engineers, mission analysts, and maintenance-planning demonstrators.", "Inspect fleet and engine state, identify abnormal behavior, compare missions, review fault evidence, estimate remaining life, and schedule or review maintenance actions."],
    ], [78 * mm, 78 * mm], styles))

    story.append(p("3. System Architecture", styles["h1"]))
    story.append(SectionRule())
    story.append(p("At a high level, DHRUVA is a pipeline with two complementary loops: a batch/replay loop for reproducible simulation and analysis, and a service loop for ingestion, persistence, streaming, and operator interaction.", styles["body"]))
    story.append(Preformatted("""Configuration and mission profile
        |
        v
Engine model + physics + environment + noise
        |
        v
Synthetic telemetry -----> Fault injection -----> Validation/export
        |                                      |
        +---------------> Digital Twin <-------+
                              |
                              v
                 residuals -> health -> TwinState
                              |
                              v
             ML inference / RUL / drift / trends / explanation
                              |
                              v
       FastAPI + database + WebSocket broadcaster + React console""", styles["code"]))
    story.append(p("The backend application is created in `backend/app/main.py`. Its lifespan initializes database tables/seeds and registers the telemetry WebSocket broadcaster. The API router is mounted under both `/api` and `/api/v1`; the WebSocket paths are `/ws/telemetry/{engine_id}` and `/ws/telemetry`.", styles["body"]))
    story.append(table([
        ["Layer", "Root location", "Responsibility"],
        ["Simulation and data", "simulation/, data/, configs/", "Generate engine telemetry, missions, noise, faults, validation, and CSV/JSON exports."],
        ["Digital twin", "digital_twin/", "Expected-vs-actual comparison, residuals, validity, component health, smoothing, and TwinState."],
        ["ML intelligence", "ml/", "Prepare data, engineer features, train or load models, infer anomaly/fault/RUL/trends, and explain results."],
        ["Backend", "backend/app/", "FastAPI services, schemas, database models, middleware, REST endpoints, and application lifecycle."],
        ["Persistence", "database/", "SQL schema, migrations, seeds, and storage concepts for fleet and operational records."],
        ["Streaming", "streaming/", "WebSocket manager and telemetry broadcast integration."],
        ["Frontend", "frontend/", "React/Vite command console, routing, context, charts, pages, controls, and live-state presentation."],
        ["Agent", "agent/", "Prompt, schema, and tool surfaces for an AI copilot capability."],
    ], [33 * mm, 42 * mm, 81 * mm], styles))

    story.append(PageBreak())
    story.append(p("4. Phase 1: Synthetic Telemetry and Simulation", styles["h1"]))
    story.append(SectionRule())
    story.append(p("Phase 1 is the data foundation. It produces reproducible telemetry that has enough structure for digital-twin residuals and ML development, while clearly documenting that the coefficients are representative and not certified engine maps.", styles["body"]))
    story.append(p("Canonical telemetry includes identifiers and context such as timestamp, engine ID, model ID, mission ID, altitude, ambient temperature, throttle, and mission phase. It also includes RPM, CHT, EGT, oil pressure and temperature, fuel flow, vibration RMS, battery voltage, alternator current, injection timing, fault labels, fault activity/severity, quality/status fields, simulation seed, Health Index, RUL, and residual columns.", styles["body"]))
    story.append(table([
        ["Simulation concern", "Current behavior"],
        ["Engine classes", "O320_CLASS (~100 HP class), ROTAX914_CLASS (~115 HP class), and AE300_CLASS (~170 HP class)."],
        ["Mission profiles", "HIGH_ALTITUDE_ISR, LONG_ENDURANCE_LOITER, RAPID_RESPONSE, HOT_WEATHER, MARITIME_PATROL, and CUSTOM, with TAKEOFF, CLIMB, CRUISE, LOITER, DESCENT, and LANDING phases."],
        ["Environment", "Altitude reduces density ratio and affects power/cooling; ambient temperature changes cooling effectiveness and thermal channels."],
        ["Sensor behavior", "Per-channel Gaussian noise is configured per engine; data quality and sensor status are carried in the schema."],
        ["Faults", "Injector degradation, combustion disturbance, cooling degradation, lubrication pressure loss, overheating, abnormal vibration, alternator/battery degradation, sensor bias/drift/dropout."],
        ["Fault timing", "Faults support start, duration, severity, gradual or sudden progression, affected sensor, and multiple active faults."],
        ["Exports", "CSV and JSON outputs under data/synthetic/healthy, faults, and missions; large generated artifacts are intended to be ignored by Git."],
    ], [39 * mm, 117 * mm], styles))
    story.append(p("The documented healthy relationships include lagged RPM, load and fuel flow relationships, thermal channels, oil temperature/pressure, vibration, electrical output, and injection timing. The public simulation entry point is `simulation.generate_telemetry`, also exported by `simulation/__init__.py`.", styles["body"]))
    story.append(p("Example commands", styles["h2"]))
    story.append(Preformatted("""pip install -r requirements.txt
pytest
python generate_demo.py
python data/generate_dataset.py --engine O320_CLASS \
    --mission HIGH_ALTITUDE_ISR --duration 120 --stem demo""", styles["code"]))

    story.append(p("5. Phase 2: Digital Twin and Health Intelligence", styles["h1"]))
    story.append(SectionRule())
    story.append(p("`digital_twin.twin.DigitalTwin` is a sequential stateful processor. For every telemetry record it reconstructs expected values from altitude, throttle, ambient temperature, previous expected RPM, previous expected oil temperature, and the selected engine parameters. It then compares actual values with expected values rather than copying measurements into the expected side.", styles["body"]))
    story.append(Preformatted("""telemetry sample
  -> expected_from_operating(...)
  -> residual = actual - expected
  -> normalized residuals and validity flags
  -> component_scores(...)
  -> EMA smoothing of components and overall index
  -> health state + TwinState""", styles["code"]))
    story.append(p("The monitored channels cover RPM, CHT, EGT, oil pressure, oil temperature, fuel flow, vibration, battery voltage, and alternator current. Component groups are thermal, lubrication, mechanical, combustion, electrical, and sensor/data quality. Health scoring uses exponential penalties based on absolute normalized residuals, combines component scores with a worst-component influence, and applies configurable exponential moving average smoothing.", styles["body"]))
    story.append(table([
        ["Health Index", "Demonstration state"],
        ["90-100", "NORMAL"],
        ["70-89", "WATCH"],
        ["40-69", "WARNING"],
        ["0-39", "CRITICAL"],
    ], [42 * mm, 114 * mm], styles))
    story.append(p("Validity is deliberately separate from scoring. A record can carry data-quality or missing-channel flags while the scoring pipeline still produces a state. Optional MLResult input can lower the index, but Phase 2 does not create ML predictions by itself. `process_dataframe` preserves chronological order and returns a list of TwinState objects; states can be flattened and exported.", styles["body"]))

    story.append(p("6. Machine-Learning and Analytics Layer", styles["h1"]))
    story.append(SectionRule())
    story.append(p("The ML layer is designed as a reusable inference stack rather than a single model. `ml.inference.inference_service.run_inference` cleans incoming telemetry, engineers temporal and residual features, extracts twin state when present, attempts trained models when artifacts exist, and falls back to deterministic heuristics when they do not.", styles["body"]))
    story.append(table([
        ["Capability", "Role in the pipeline"],
        ["Cleaning", "Normalize column names, validate required fields, remove duplicates, identify telemetry/twin schemas, and preserve inference consistency."],
        ["Feature engineering", "Create rates, rolling features, cross-sensor relationships, physics-prediction residuals, and twin residual features."],
        ["Anomaly detection", "Estimate whether the current operating window is abnormal and produce score/severity."],
        ["Fault classification", "Estimate a fault type and confidence for conditions such as cooling, lubrication, vibration, sensor, or electrical issues."],
        ["RUL", "Use a trained model when available, otherwise map Health Index and anomaly evidence to a prototype remaining-life estimate with uncertainty."],
        ["Sensor drift", "Look for persistent bias or drift patterns that can be distinguished from engine faults."],
        ["Trend forecasting", "Forecast short-horizon sensor or health trends from the prepared series."],
        ["Explainability", "Use model explanations when possible; otherwise report high-magnitude telemetry factors as a transparent fallback."],
    ], [40 * mm, 116 * mm], styles))
    story.append(p("The final inference payload contains engine and timestamp context, Health Index and status, anomaly detection, fault type/confidence, RUL information, drift, trends, explanation factors, and related state. The service explicitly catches unavailable or failing model artifacts and falls back to heuristics, which makes demos resilient but also means production deployments must surface model provenance and fallback status to operators.", styles["body"]))

    story.append(PageBreak())
    story.append(p("7. Backend API and Persistence", styles["h1"]))
    story.append(SectionRule())
    story.append(p("The FastAPI application is the integration boundary between telemetry producers, persistence, digital-twin/ML services, and the frontend. CORS, request logging, centralized error handling, database initialization, and OpenAPI documentation are wired at application startup.", styles["body"]))
    story.append(table([
        ["API group", "Representative routes and purpose"],
        ["Health", "`GET /api/health` for system health and readiness information."],
        ["Engines", "List/create engines, list models, retrieve engine details, and retrieve engine telemetry."],
        ["Telemetry", "Ingest telemetry and retrieve historical data."],
        ["Fleet", "Fleet summary and fleet telemetry views."],
        ["Faults and alerts", "Review fault records and operator alert state."],
        ["Missions", "List, create, and retrieve active/current mission information; `/api/mission` bridges the frontend singular route."],
        ["Twin and subsystems", "Health, subsystem conditions, and digital-twin-derived operational status."],
        ["Tuning", "Retrieve candidates and create tune profiles for calibration workflows."],
        ["Replay", "Replay or inspect historical telemetry scenarios."],
        ["Reports and maintenance", "Generate engine reports and synchronize MRO/maintenance information."],
        ["Agent", "Expose the AI copilot integration surface."],
    ], [43 * mm, 113 * mm], styles))
    story.append(p("The SQL schema defines tables for engine models, engines, telemetry, twin states, faults, missions, tune profiles, and maintenance. Foreign keys preserve relationships from an engine to its model and operational records. Time-oriented indexes support engine-plus-timestamp queries for telemetry, twin states, and faults.", styles["body"]))
    story.append(p("The schema shown in `database/schema.sql` uses PostgreSQL-oriented types such as BIGSERIAL and JSONB. Runtime database settings and migrations should be treated as deployment configuration; the repository also contains seeds and migration folders for environment-specific initialization.", styles["body"]))

    story.append(p("8. Streaming and Live Operation", styles["h1"]))
    story.append(SectionRule())
    story.append(p("The backend registers `TelemetryService` with a WebSocket manager during application startup. Clients can connect to an engine-specific stream at `/ws/telemetry/{engine_id}` or subscribe to all engines at `/ws/telemetry`. The manager tracks connections and broadcasts telemetry to the appropriate audience. The frontend's EngineContext owns stream state and exposes a toggle used by the shell/sidebar.", styles["body"]))
    story.append(p("A production version should define message envelopes, authentication, reconnect/backoff behavior, heartbeat semantics, ordering guarantees, replay boundaries, and backpressure policy explicitly. The current endpoint keeps the connection open and receives optional client text messages while the server-side telemetry service performs broadcasts.", styles["body"]))

    story.append(p("9. Frontend Operational Console", styles["h1"]))
    story.append(SectionRule())
    story.append(p("The frontend is a React 19 and Vite application using TypeScript, React Router, Recharts, Motion, Tailwind CSS, and Lucide icons. The application shell has a fixed tactical sidebar, a command header, an aerospace-grid main viewport, authentication context, engine context, and an error boundary.", styles["body"]))
    story.append(table([
        ["Route/view", "Operational purpose"],
        ["Entry and Login", "Authentication and entry flow."],
        ["Executive Overview", "High-level command and fleet context."],
        ["Dashboard", "Primary operational dashboard for health, alerts, and live signals."],
        ["Engine Details", "Per-engine telemetry, health, and subsystem information."],
        ["Fault Diagnostics", "Fault evidence and root-cause-oriented diagnostics."],
        ["Mission Simulation", "Mission scenario and telemetry simulation sandbox."],
        ["Mission Tuning", "Digital-twin mission tuning and calibration workflow."],
        ["Fleet Monitoring", "Fleet-wide airspace and engine monitoring view."],
        ["Maintenance", "Predictive maintenance and MRO scheduling workflow."],
    ], [43 * mm, 113 * mm], styles))
    story.append(p("The documented UI direction is a dark aerospace command-console/HUD language with cyan, amber, red, and green status semantics. The frontend package exposes `npm run dev`, `npm run lint`, `npm run build`, and `npm run preview`. A design guidance document in `docs/` emphasizes preserving routes, data flow, WebSocket behavior, responsive behavior, and existing controls while improving spacing and scanability.", styles["body"]))

    story.append(PageBreak())
    story.append(p("10. Agent and Copilot Surface", styles["h1"]))
    story.append(SectionRule())
    story.append(p("The `agent/` package contains an agent entry point, prompts, schemas, and tools. The backend includes an AI Copilot Agent API router. Together these indicate an intended conversational layer for querying operational state or assisting with analysis. The agent should be treated as an interpretation and workflow-assistance surface, not as an autonomous authority for flight or maintenance release decisions.", styles["body"]))
    story.append(p("Recommended contract boundary: the agent should consume typed, timestamped, provenance-aware facts from the backend and return citations to the underlying engine, telemetry, twin state, fault, and maintenance records. Any action that changes configuration, tuning, or maintenance status should remain explicit and auditable.", styles["body"]))

    story.append(p("11. Testing and Quality Signals", styles["h1"]))
    story.append(SectionRule())
    story.append(p("The root tests cover the main simulation and ML contracts. Simulation tests verify engine model loading, mission profile loading, schema shape, reproducibility from seeds, environment effects, engine differences, fault labels, gradual/sudden progression, sensor drift/dropout, invalid parameters, export, and correlated channels. Twin tests verify healthy state, thermal/lubrication/vibration effects, sensor drift, sudden faults, and gradual degradation. ML tests cover cleaning, feature engineering, preprocessing consistency, anomaly and fault models, RUL, trends, explainability, sensor drift, and inference contracts.", styles["body"]))
    story.append(table([
        ["Check", "Command or evidence"],
        ["Python test suite", "`pytest` from the repository root."],
        ["Demo generation", "`python generate_demo.py` writes representative healthy/fault/missions artifacts."],
        ["ML demonstration", "`python ml/run_demo.py` compares a healthy window with a cooling-degradation sequence."],
        ["Frontend type/lint check", "`cd frontend; npm run lint` runs TypeScript no-emit checking."],
        ["Frontend production build", "`cd frontend; npm run build` runs TypeScript and Vite build."],
        ["Backend API visibility", "FastAPI OpenAPI at `/openapi.json`, Swagger UI at `/docs`, ReDoc at `/redoc`."],
    ], [55 * mm, 101 * mm], styles))
    story.append(p("A useful next quality step is an end-to-end test that starts the backend, ingests one generated telemetry window, verifies persistence, consumes a WebSocket message, runs inference, and confirms the frontend-facing response contract. This would validate the integration seams currently covered mostly by unit and component-level tests.", styles["body"]))

    story.append(p("12. Local Runbook", styles["h1"]))
    story.append(SectionRule())
    story.append(p("Python environment", styles["h2"]))
    story.append(Preformatted("""python -m venv .venv
.venv\\Scripts\\Activate.ps1
pip install -r requirements.txt
pytest
python generate_demo.py""", styles["code"]))
    story.append(p("Backend", styles["h2"]))
    story.append(Preformatted("""uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
# API docs: http://localhost:8000/docs""", styles["code"]))
    story.append(p("Frontend", styles["h2"]))
    story.append(Preformatted("""cd frontend
npm install
npm run dev
# Vite development server is configured for port 3000""", styles["code"]))
    story.append(p("Containers and deployment", styles["h2"]))
    story.append(p("The repository contains root, backend, deployment, and team-specific Docker Compose/Dockerfile surfaces. Before using a compose file, verify which copy is intended for the target environment, confirm database credentials and connection strings, and check that frontend API/WebSocket base URLs match the deployment topology.", styles["body"]))

    story.append(PageBreak())
    story.append(p("13. Data and Model Lifecycle", styles["h1"]))
    story.append(SectionRule())
    story.append(table([
        ["Stage", "Inputs", "Outputs"],
        ["Configure", "JSON under configs/ for engines, missions, faults, simulation, twin health.", "Validated named configurations."],
        ["Simulate", "Engine model, mission, duration, sampling rate, seed, optional faults.", "Telemetry DataFrame and CSV/JSON datasets."],
        ["Twin", "Ordered telemetry records and optional MLResult.", "Residuals, component health, Health Index, state, validity flags."],
        ["Train", "Clean telemetry, labelled faults, twin features, configured feature columns.", "Model artifacts, preprocessors, metrics, and model metadata."],
        ["Infer", "Telemetry window, available twin state, optional trained artifacts.", "Anomaly, fault, RUL, drift, trends, explanations, status."],
        ["Persist", "Telemetry, engine, mission, twin, fault, tuning, report, maintenance records.", "Queryable operational history."],
        ["Present", "REST responses, WebSocket events, context state.", "Dashboards, diagnostics, simulation, fleet, and maintenance views."],
    ], [30 * mm, 75 * mm, 51 * mm], styles))
    story.append(p("Reproducibility is a strong design feature: simulation accepts a seed, outputs carry `simulation_seed`, and ML tests use in-memory fixtures and temporary artifact paths. For deployment, add model version, training dataset identifier, configuration hash, and inference timestamp to every derived result so operators can reconstruct why a state was produced.", styles["body"]))

    story.append(p("14. Strengths and Engineering Tradeoffs", styles["h1"]))
    story.append(SectionRule())
    story.extend(bullets([
        "Strong modular decomposition: simulation, twin, ML, backend, persistence, streaming, frontend, and agent concerns are separated.",
        "Physics-inspired residuals provide an interpretable reference signal and make synthetic fault behavior more realistic than independent random columns.",
        "The sequential twin retains lagged state, allowing operating history to influence expected RPM and oil temperature.",
        "ML inference degrades gracefully when model artifacts are unavailable, which supports demos and incremental development.",
        "The API and database shapes cover the main operational objects needed for an end-to-end demonstrator.",
        "The main tradeoff is prototype fidelity: representative coefficients, tunable thresholds, heuristic fallbacks, and synthetic data are useful for development but cannot establish real-world safety or maintenance decisions.",
    ], styles["bullet"]))

    story.append(p("15. Limitations and Production Readiness Gaps", styles["h1"]))
    story.append(SectionRule())
    story.extend(bullets([
        "The simulation is algebraic and physics-inspired, not a thermodynamic cycle model or certified FADEC model.",
        "Engine coefficients and health bands are demonstration values; they need calibration against traceable test-cell and flight data.",
        "Synthetic Gaussian noise does not represent the full error, latency, dropout, calibration, or wiring behavior of real sensors.",
        "RUL estimates need validated survival/degradation targets, uncertainty calibration, censoring treatment, and maintenance-label governance.",
        "Production streaming requires authentication, authorization, reconnect policy, message schemas, ordering, backpressure, and observability.",
        "Database migrations, seed behavior, secrets, backups, retention, and tenancy need environment-specific operational hardening.",
        "Model fallbacks should be visible in the UI and logs, with model/data/config provenance attached to every prediction.",
        "Safety-critical use would require independent verification, validation, hazard analysis, human authority, and applicable aviation certification processes.",
    ], styles["bullet"]))

    story.append(p("16. Recommended Evolution Path", styles["h1"]))
    story.append(SectionRule())
    story.append(table([
        ["Priority", "Recommended next step", "Why it matters"],
        ["1", "Define canonical API/event schemas and generated TypeScript/Python clients.", "Prevents drift between backend, ML, streaming, and frontend contracts."],
        ["2", "Add an end-to-end telemetry-to-dashboard integration test.", "Validates the complete operational path, not only isolated modules."],
        ["3", "Attach provenance and fallback metadata to twin/ML results.", "Lets operators distinguish trained-model output from heuristic demo output."],
        ["4", "Calibrate engine and mission models with governed reference data.", "Moves from illustrative behavior toward useful engineering estimates."],
        ["5", "Harden WebSocket and database operations.", "Improves reliability, security, replay, recovery, and fleet-scale behavior."],
        ["6", "Establish RUL evaluation protocols and uncertainty reporting.", "Makes predictive maintenance claims measurable and auditable."],
        ["7", "Add role-based approval and audit trails around tuning and maintenance actions.", "Keeps human authority explicit for consequential workflows."],
    ], [16 * mm, 83 * mm, 61 * mm], styles))

    story.append(p("17. Repository Map", styles["h1"]))
    story.append(SectionRule())
    story.append(Preformatted("""DHRUVA/
  agent/              AI copilot entry point, prompts, schemas, tools
  backend/app/        FastAPI app, routes, services, models, schemas
  configs/             engine, mission, fault, safety, simulation, twin JSON
  data/                schemas, generators, raw/processed/synthetic data
  database/            schema, migrations, seeds
  digital_twin/        engines, physics, residuals, health, state, validity
  docs/                phase docs, architecture and UX guidance
  frontend/            React/Vite operational console
  ml/                  preprocessing, models, inference, RUL, trends, drift
  simulation/          engine simulator, missions, config loader, paths
  streaming/            WebSocket manager and stream integration
  tests/                simulation, twin, ML, and backend tests
  docker-compose.yml    root orchestration entry point
  pyproject.toml        Python package metadata and dependencies""", styles["code"]))
    story.append(Spacer(1, 8 * mm))
    story.append(p("Conclusion", styles["h1"]))
    story.append(SectionRule())
    story.append(p("DHRUVA's core contribution is an explainable, end-to-end prototype: configurable mission-aware telemetry becomes expected physics, residual evidence, health state, ML interpretation, persistent operational records, live streams, and an operator console. Its architecture is already shaped for incremental maturation. The essential next step is disciplined validation and provenance: establish which outputs are simulated, heuristic, trained, calibrated, or certified, and make that distinction visible wherever a human might act on the result.", styles["body"]))
    story.append(Spacer(1, 8 * mm))
    story.append(p("Source basis: repository files and documentation available at generation time. This document is descriptive and does not add claims beyond the implementation and project notes inspected.", styles["small"]))
    return story


def main():
    styles = build_styles()
    document = SimpleDocTemplate(
        str(OUTPUT), pagesize=A4, rightMargin=18 * mm, leftMargin=18 * mm,
        topMargin=17 * mm, bottomMargin=18 * mm, title="DHRUVA Project Overview",
        author="DHRUVA repository",
    )
    document.build(make_story(styles), onFirstPage=header_footer, onLaterPages=header_footer)
    print(OUTPUT)


if __name__ == "__main__":
    main()