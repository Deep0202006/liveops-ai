"""Stable simulation-pack constants and scenario definitions."""

from __future__ import annotations

SCHEMA_VERSION = "1.0"
SENSOR_NAMES = ("sensor_2", "sensor_3", "sensor_4", "sensor_9", "sensor_11", "sensor_14", "sensor_21")
AVAILABLE_SPEEDS = (1, 5, 20)
SCENARIOS = {
    "NORMAL_SHIFT": {
        "slug": "normal-shift",
        "title": "Normal Shift",
        "description": "A stable fleet with a small watch list and no broad maintenance pressure.",
        "machine_ids": (1, 2, 4, 5, 6, 7, 9, 10, 3, 8, 18, 17),
    },
    "DEGRADATION_WAVE": {
        "slug": "degradation-wave",
        "title": "Degradation Wave",
        "description": "Several assets cross observation and maintenance-planning thresholds.",
        "machine_ids": (1, 4, 8, 18, 21, 30, 37, 41, 43, 45, 17, 20),
    },
    "MAINTENANCE_WINDOW": {
        "slug": "maintenance-window",
        "title": "Maintenance Window",
        "description": "Low-RUL assets compete for a constrained simulated inspection window.",
        "machine_ids": (17, 20, 24, 31, 32, 34, 38, 40, 42, 46, 49, 52),
    },
}

EVENT_TYPES = {
    "ASSET_STARTED", "STATUS_CHANGED", "RUL_THRESHOLD_CROSSED", "SENSOR_DEVIATION",
    "RUL_REVISION", "MAINTENANCE_DUE", "CRITICAL_RISK", "SIMULATION_PAUSED",
    "SIMULATION_RESUMED", "SCENARIO_RESET",
}
