"""Public simulation API for Phase 1 telemetry generation."""

from data.generators.telemetry_generator import generate_telemetry, write_dataset
from digital_twin.engines import get_engine_model

__all__ = ["generate_telemetry", "write_dataset", "get_engine_model"]
