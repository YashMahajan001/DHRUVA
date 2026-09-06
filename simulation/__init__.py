"""Phase 1 synthetic telemetry package.

Public API is imported lazily to avoid circular imports with engine configs.
"""

from typing import Any

__all__ = ["generate_telemetry", "get_engine_model"]


def __getattr__(name: str) -> Any:
    if name == "generate_telemetry":
        from simulation.engine_simulator import generate_telemetry

        return generate_telemetry
    if name == "get_engine_model":
        from digital_twin.engines import get_engine_model

        return get_engine_model
    raise AttributeError(name)
