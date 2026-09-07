"""Engine model registry."""

from __future__ import annotations

from digital_twin.engines.ae300 import AE300Class
from digital_twin.engines.base_engine import BaseEngineModel
from digital_twin.engines.o320 import O320Class
from digital_twin.engines.rotax914 import Rotax914Class
from simulation.exceptions import ConfigError

ENGINE_CLASSES: dict[str, type[BaseEngineModel]] = {
    "O320_CLASS": O320Class,
    "ROTAX914_CLASS": Rotax914Class,
    "AE300_CLASS": AE300Class,
}


def get_engine_model(model_id: str) -> BaseEngineModel:
    """Instantiate a representative engine model by id."""
    key = model_id.strip().upper()
    if key not in ENGINE_CLASSES:
        known = ", ".join(sorted(ENGINE_CLASSES))
        raise ConfigError(f"Unknown engine model {model_id!r}. Known: {known}")
    return ENGINE_CLASSES[key]()
