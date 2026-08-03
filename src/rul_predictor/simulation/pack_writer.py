"""Write deterministic packs and their catalog."""

from __future__ import annotations

import gzip
import json
from pathlib import Path

from .scenario_builder import build_all_scenarios
from .validation import validate_pack


def write_packs(root: Path) -> list[dict]:
    output = root / "web/public/simulations"
    output.mkdir(parents=True, exist_ok=True)
    packs = build_all_scenarios(root)
    entries: list[dict] = []
    for pack in packs:
        validate_pack(pack)
        payload = json.dumps(pack, separators=(",", ":"), ensure_ascii=False) + "\n"
        path = output / f"{pack['slug']}.json"
        path.write_bytes(payload.encode("utf-8"))
        gzip_size = len(gzip.compress(payload.encode(), compresslevel=9, mtime=0))
        entries.append({"scenario_id": pack["scenario_id"], "slug": pack["slug"], "title": pack["title"], "description": pack["description"], "url": f"/simulations/{pack['slug']}.json", "checksum": pack["checksum"], "gzip_bytes": gzip_size})
    catalog = {"schema_version": "1.0", "simulation_only": True, "simulation_warning": "No physical factory connection.", "scenarios": entries}
    (output / "catalog.json").write_bytes((json.dumps(catalog, separators=(",", ":"), ensure_ascii=False) + "\n").encode("utf-8"))
    return entries
