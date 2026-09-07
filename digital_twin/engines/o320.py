"""O-320 class representative model (~100 HP class, synthetic)."""

from digital_twin.engines.base_engine import BaseEngineModel


class O320Class(BaseEngineModel):
    model_id = "O320_CLASS"
    config_stem = "o320"
