"""Verify committed scenario integrity and compressed-size budgets."""

from pathlib import Path
import gzip
import json

from rul_predictor.simulation.validation import validate_pack

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "web/public/simulations"

if __name__ == "__main__":
    catalog = json.loads((OUTPUT / "catalog.json").read_text(encoding="utf-8"))
    total = 0
    for entry in catalog["scenarios"]:
        path = OUTPUT / f"{entry['slug']}.json"
        raw = path.read_bytes()
        pack = json.loads(raw)
        validate_pack(pack)
        size = len(gzip.compress(raw, compresslevel=9, mtime=0))
        assert size == entry["gzip_bytes"] and size < 700 * 1024
        total += size
    assert total < 2 * 1024 * 1024
    print(json.dumps({"status": "VERIFIED", "scenario_count": len(catalog["scenarios"]), "total_gzip_bytes": total}, indent=2))
