"""Scenario-pack integrity validation."""

from __future__ import annotations

import hashlib
import json

from .contracts import EVENT_TYPES, SCHEMA_VERSION


def computed_checksum(pack: dict) -> str:
    payload = {key: value for key, value in pack.items() if key != "checksum"}
    return hashlib.sha256(json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def validate_pack(pack: dict) -> None:
    assert pack["schema_version"] == SCHEMA_VERSION
    assert pack["simulation_only"] is True
    assert pack["source"]["dataset_subset"] == "FD001"
    assert pack["checksum"] == computed_checksum(pack)
    assert 12 <= len(pack["assets"]) <= 16
    assert len(pack["source_machine_ids"]) == len(set(pack["source_machine_ids"]))
    for asset in pack["assets"]:
        assert asset["samples"]
        for sample in asset["samples"]:
            assert sample["predicted_rul"] >= 0
            if sample["lower_bound"] is not None:
                assert 0 <= sample["lower_bound"] <= sample["predicted_rul"] <= sample["upper_bound"]
    event_ids = [event["id"] for event in pack["events"]]
    assert len(event_ids) == len(set(event_ids))
    assert all(event["type"] in EVENT_TYPES for event in pack["events"])
