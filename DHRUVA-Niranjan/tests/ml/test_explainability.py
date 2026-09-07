from sklearn.ensemble import RandomForestClassifier
import numpy as np

from ml.explainability.shap_explainer import explain_prediction


def test_explainability_returns_top_factors():
    rng = np.random.default_rng(0)
    x = rng.normal(size=(40, 4))
    y = (x[:, 0] + x[:, 1] > 0).astype(int)
    model = RandomForestClassifier(n_estimators=20, random_state=0)
    model.fit(x, y)
    result = explain_prediction(model, x, ["a", "b", "c", "d"], top_k=3)
    assert "top_factors" in result
    assert len(result["top_factors"]) <= 3
    assert result["method"] in {"shap", "feature_importance_fallback"}
    for item in result["top_factors"]:
        assert "feature" in item and "impact" in item
