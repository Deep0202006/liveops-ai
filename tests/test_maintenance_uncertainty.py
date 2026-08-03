from rul_predictor.config import MaintenanceConfig
from rul_predictor.maintenance import maintenance_status
from rul_predictor.uncertainty import validation_based_range


def test_maintenance_status_boundaries_are_central_and_deterministic():
    config = MaintenanceConfig(urgent_at_or_below=25, plan_at_or_below=50, monitor_at_or_below=80)
    assert maintenance_status(25, config) == "CRITICAL"
    assert maintenance_status(25.01, config) == "PLAN_MAINTENANCE"
    assert maintenance_status(50, config) == "PLAN_MAINTENANCE"
    assert maintenance_status(50.01, config) == "MONITOR"
    assert maintenance_status(80, config) == "MONITOR"
    assert maintenance_status(80.01, config) == "HEALTHY"


def test_validation_range_is_non_negative_contains_point_and_can_be_unavailable():
    interval = {"lower_residual_cycles": -20.0, "upper_residual_cycles": 10.0}
    assert validation_based_range(5.0, interval) == (0.0, 15.0)
    assert validation_based_range(5.0, None) == (None, None)
