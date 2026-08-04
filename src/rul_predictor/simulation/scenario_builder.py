"""Build compact deterministic scenario packs from official FD001 trajectories."""

from __future__ import annotations

from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path

import numpy as np

from ..config import BackendConfig
from ..data_loading import load_cmapss_trajectory
from ..schemas import ArtifactMode, PredictionRequest
from ..service import RULService
from .contracts import AVAILABLE_SPEEDS, SCENARIOS, SCHEMA_VERSION, SENSOR_NAMES
from .event_rules import derive_events
from .scenario_selection import display_asset_id, source_machine_ids

GENERATION_TIMESTAMP = "2026-08-03T00:00:00Z"
STEPS = 30


def _checksum(value: dict) -> str:
    payload = {key: item for key, item in value.items() if key != "checksum"}
    return hashlib.sha256(json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def build_scenario(root: Path, scenario_id: str) -> dict:
    definition = SCENARIOS[scenario_id]
    config = BackendConfig(data_directory=root / "data/raw", artifact_directory=root / "artifacts/real", mode=ArtifactMode.REAL)
    service = RULService(config)
    metadata = service.get_model_metadata()
    frame = load_cmapss_trajectory(config.test_path)
    assets: list[dict] = []
    all_events: list[dict] = []
    for index, machine_id in enumerate(source_machine_ids(scenario_id)):
        trajectory = frame[frame.machine_id == machine_id].reset_index(drop=True)
        positions = np.linspace(max(4, len(trajectory) - STEPS), len(trajectory) - 1, STEPS, dtype=int)
        positions = np.maximum.accumulate(positions)
        samples: list[dict] = []
        previous_rul: float | None = None
        for step, position in enumerate(positions):
            prefix = trajectory.iloc[: position + 1]
            prediction = service.predict(PredictionRequest(machine_id=machine_id, trajectory=prefix))
            rul_delta = 0.0 if previous_rul is None else round(prediction.predicted_rul - previous_rul, 2)
            previous_rul = prediction.predicted_rul
            samples.append({
                "step": step,
                "source_cycle": prediction.observed_through_cycle,
                "sensors": {name: round(float(prefix.iloc[-1][name]), 5) for name in SENSOR_NAMES},
                "predicted_rul": prediction.predicted_rul,
                "lower_bound": prediction.lower_bound,
                "upper_bound": prediction.upper_bound,
                "maintenance_status": prediction.maintenance_status,
                "rul_change": rul_delta,
                "important_features": list(prediction.important_features),
                "warnings": list(prediction.warnings),
                "model_version": prediction.model_version,
            })
        asset_id = display_asset_id(index)
        events = derive_events(asset_id, samples)
        all_events.extend(events)
        assets.append({"asset_id": asset_id, "source_machine_id": machine_id, "display_name": f"Rotating Unit {asset_id}", "samples": samples})
    all_events.sort(key=lambda item: (item["cycle"], item["asset_id"], item["type"]))
    pack = {
        "schema_version": SCHEMA_VERSION,
        "scenario_id": scenario_id,
        "slug": definition["slug"],
        "title": definition["title"],
        "description": definition["description"],
        "simulation_only": True,
        "simulation_label": "LIVE SIMULATION",
        "simulation_warning": "Deterministic replay; no physical factory connection.",
        "generated_at": GENERATION_TIMESTAMP,
        "source": {"dataset_name": metadata.dataset_name, "dataset_subset": metadata.dataset_subset, "dataset_fingerprint": metadata.raw["dataset_fingerprint"], "attribution": "NASA C-MAPSS FD001"},
        "model": {"name": metadata.model_name, "version": metadata.model_version, "rul_unit": metadata.rul_unit},
        "source_machine_ids": list(source_machine_ids(scenario_id)),
        "asset_manifest": [{key: asset[key] for key in ("asset_id", "source_machine_id", "display_name")} for asset in assets],
        "timeline": {"start": 0, "end": STEPS - 1, "default_start": 0, "available_speeds": list(AVAILABLE_SPEEDS)},
        "sensor_definitions": [{"id": name, "label": name.replace("_", " ").title(), "unit": "normalized FD001 reading"} for name in SENSOR_NAMES],
        "assets": assets,
        "events": all_events,
    }
    pack["checksum"] = _checksum(pack)
    return pack


def build_all_scenarios(root: Path) -> list[dict]:
    return [build_scenario(root, scenario_id) for scenario_id in SCENARIOS]
