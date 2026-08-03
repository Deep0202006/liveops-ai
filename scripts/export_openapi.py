"""Deterministically export the frozen API v1 OpenAPI contract."""

import json
from pathlib import Path

from rul_predictor.api import create_api_app
from rul_predictor.schemas import ArtifactMode

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs/web-api/openapi-v1.json"


def main() -> int:
    schema = create_api_app(ArtifactMode.DEMO).openapi()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(schema, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"OPENAPI_EXPORTED: {OUTPUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
