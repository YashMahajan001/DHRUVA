"""Simulation configuration and validation errors."""


class ConfigError(ValueError):
    """Invalid engine, mission, or generator configuration."""


class ValidationError(ValueError):
    """Generated telemetry failed integrity checks."""
