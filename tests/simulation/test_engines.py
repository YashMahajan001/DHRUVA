from digital_twin.engines import get_engine_model


def test_engine_model_loading():
    for model_id in ("O320_CLASS", "ROTAX914_CLASS", "AE300_CLASS"):
        engine = get_engine_model(model_id)
        assert engine.model_id == model_id
        assert engine.params.max_rpm > engine.params.idle_rpm


def test_unknown_engine_raises():
    import pytest
    from simulation.exceptions import ConfigError

    with pytest.raises(ConfigError):
        get_engine_model("NOT_A_REAL_ENGINE")
