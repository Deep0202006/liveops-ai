"""Explicitly build isolated synthetic demo data and artifact."""

import argparse
import json
import sys
from pathlib import Path

from rul_predictor.demo import build_demo_artifact
from rul_predictor.exceptions import RULPredictorError


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--artifacts", type=Path, default=Path("artifacts/demo"))
    parser.add_argument("--samples", type=Path, default=Path("data/sample"))
    args = parser.parse_args()
    try:
        result = build_demo_artifact(args.artifacts, args.samples)
    except (RULPredictorError, OSError, RuntimeError, ValueError) as exc:
        print(f"DEMO_BUILD_FAILED: {exc}", file=sys.stderr)
        return 2
    print(json.dumps(result.to_dict(), indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
