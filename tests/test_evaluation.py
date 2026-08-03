import numpy as np

from rul_predictor.evaluation import regression_metrics


def test_regression_metrics_have_cycle_units():
    metrics = regression_metrics(np.array([0.0, 10.0]), np.array([2.0, 8.0]))
    assert metrics["mae_cycles"] == 2.0
    assert metrics["rmse_cycles"] == 2.0
    assert metrics["median_absolute_error_cycles"] == 2.0
