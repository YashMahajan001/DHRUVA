# DHRUVA

AI-enabled Digital Twin platform for real-time health monitoring, fault detection, RUL prediction, and mission-aware optimization of aero piston engines used in MALE UAVs.

**Problem Statement ID:** 26054 (Smart India Hackathon 2026)

This is a representative prototype. It does not represent classified, proprietary, certified, or operational DRDO engine data or aircraft safety limits.

## Phase 1–2 (current)

- Phase 1: synthetic telemetry + engine/mission simulation ([docs/phase1.md](docs/phase1.md))
- Phase 2: Digital Twin expected-vs-actual residuals and health index ([docs/phase2.md](docs/phase2.md))

```bash
pip install -r requirements.txt
pytest
python generate_demo.py
```
