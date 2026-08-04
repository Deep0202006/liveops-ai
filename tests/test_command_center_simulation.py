from pathlib import Path
import gzip
import json

import pytest

from rul_predictor.simulation.event_rules import derive_events
from rul_predictor.simulation.scenario_builder import build_scenario
from rul_predictor.simulation.scenario_selection import source_machine_ids
from rul_predictor.simulation.validation import validate_pack

ROOT = Path(__file__).resolve().parents[1]
RAW_AVAILABLE = (ROOT / "data/raw/test_FD001.txt").is_file()


def test_selection_is_fixed_and_unique():
    first = source_machine_ids("NORMAL_SHIFT")
    assert first == source_machine_ids("NORMAL_SHIFT") and len(first) == len(set(first)) == 12


def test_event_rules_deduplicate_threshold_crossings():
    samples = [{"step": 0, "maintenance_status": "HEALTHY"}, {"step": 1, "maintenance_status": "MONITOR"}, {"step": 2, "maintenance_status": "HEALTHY"}, {"step": 3, "maintenance_status": "MONITOR"}]
    events = derive_events("RT-01", samples)
    assert len([event for event in events if event["type"] == "RUL_THRESHOLD_CROSSED"]) == 1


@pytest.mark.skipif(not RAW_AVAILABLE, reason="official FD001 is required only to regenerate packs")
def test_same_scenario_is_identical_and_model_backed():
    first = build_scenario(ROOT, "NORMAL_SHIFT")
    second = build_scenario(ROOT, "NORMAL_SHIFT")
    assert first == second
    validate_pack(first)
    assert all(sample["model_version"] == "1.0.0" for asset in first["assets"] for sample in asset["samples"])


def test_committed_catalog_and_size_budget():
    output = ROOT / "web/public/simulations"
    catalog = json.loads((output / "catalog.json").read_text(encoding="utf-8"))
    assert len(catalog["scenarios"]) == 3
    total = 0
    for entry in catalog["scenarios"]:
        raw = (output / f"{entry['slug']}.json").read_bytes()
        pack = json.loads(raw)
        validate_pack(pack)
        assert entry["checksum"] == pack["checksum"]
        size = len(gzip.compress(raw, compresslevel=9, mtime=0))
        assert size < 700 * 1024
        total += size
    assert total < 2 * 1024 * 1024
