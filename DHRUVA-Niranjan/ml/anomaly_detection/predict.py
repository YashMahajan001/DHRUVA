"""Anomaly prediction entrypoint."""

from ml.anomaly_detection.train import predict_anomaly, train_anomaly_detector

__all__ = ["predict_anomaly", "train_anomaly_detector"]
