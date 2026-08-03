"""Authoritative demonstration maintenance-status rules."""

from .config import MaintenanceConfig


def maintenance_status(predicted_rul: float, config: MaintenanceConfig) -> str:
    """Map cycle-based RUL to deterministic project demonstration status."""

    if predicted_rul <= config.urgent_at_or_below:
        return "CRITICAL"
    if predicted_rul <= config.plan_at_or_below:
        return "PLAN_MAINTENANCE"
    if predicted_rul <= config.monitor_at_or_below:
        return "MONITOR"
    return "HEALTHY"
