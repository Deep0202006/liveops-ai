"""Derive replay-safe events from consecutive model-backed samples."""

from __future__ import annotations


def derive_events(asset_id: str, samples: list[dict]) -> list[dict]:
    events: list[dict] = []
    if not samples:
        return events
    events.append({"id": f"{asset_id}-0-start", "cycle": 0, "asset_id": asset_id, "type": "ASSET_STARTED", "severity": "information", "message": f"Unit {asset_id} entered the simulated shift."})
    emitted: set[str] = set()
    for previous, current in zip(samples, samples[1:]):
        if current["maintenance_status"] == previous["maintenance_status"]:
            continue
        status = current["maintenance_status"]
        key = f"{asset_id}-{status}"
        if key in emitted:
            continue
        emitted.add(key)
        event_type = "CRITICAL_RISK" if status == "CRITICAL" else "MAINTENANCE_DUE" if status == "PLAN_MAINTENANCE" else "RUL_THRESHOLD_CROSSED" if status == "MONITOR" else "STATUS_CHANGED"
        severity = "critical" if status == "CRITICAL" else "warning" if status in {"PLAN_MAINTENANCE", "MONITOR"} else "information"
        label = "critical review" if status == "CRITICAL" else "maintenance-planning" if status == "PLAN_MAINTENANCE" else "monitoring"
        events.append({"id": f"{asset_id}-{current['step']}-{event_type.lower()}", "cycle": current["step"], "asset_id": asset_id, "type": event_type, "severity": severity, "message": f"Unit {asset_id} crossed the {label} threshold."})
        if event_type != "STATUS_CHANGED":
            events.append({"id": f"{asset_id}-{current['step']}-status", "cycle": current["step"], "asset_id": asset_id, "type": "STATUS_CHANGED", "severity": severity, "message": f"Unit {asset_id} status changed to {status.replace('_', ' ').lower()}."})
    return events
