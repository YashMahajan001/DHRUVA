"""Rotax 914 class representative model (~115 HP class, synthetic)."""

from digital_twin.engines.base_engine import BaseEngineModel


class Rotax914Class(BaseEngineModel):
    model_id = "ROTAX914_CLASS"
    config_stem = "rotax914"
