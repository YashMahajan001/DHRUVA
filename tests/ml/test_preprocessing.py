from ml.data_processing.preprocessing import TelemetryPreprocessor
from ml.utils.sample_data import make_training_dataset


def test_fit_transform_is_consistent():
    data = make_training_dataset(rows_per_class=12)
    pre = TelemetryPreprocessor()
    featured_a, scaled_a = pre.fit_transform(data.head(40))
    featured_b, scaled_b = pre.transform(data.head(40))
    assert featured_a.shape[0] == featured_b.shape[0]
    assert scaled_a.shape == scaled_b.shape
    assert abs(scaled_a.mean() - scaled_b.mean()) < 1e-9
