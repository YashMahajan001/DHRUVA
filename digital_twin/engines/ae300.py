"""AE300 class representative model (~170 HP class, synthetic)."""

from digital_twin.engines.base_engine import BaseEngineModel


class AE300Class(BaseEngineModel):
    model_id = "AE300_CLASS"
    config_stem = "ae300"
