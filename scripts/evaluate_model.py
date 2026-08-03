"""Evaluate a trusted artifact on the official C-MAPSS FD001 test split."""

import argparse
import json
from dataclasses import asdict
import sys
from pathlib import Path

from rul_predictor.artifacts import load_artifact
from rul_predictor.config import DEFAULT_CONFIG, TrainingConfig
from rul_predictor.data_loading import load_cmapss_trajectory, load_official_rul
from rul_predictor.exceptions import DataValidationError, ModelArtifactError
from rul_predictor.training import evaluate_official_test


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--test", type=Path, default=DEFAULT_CONFIG.test_path)
    parser.add_argument("--rul", type=Path, default=DEFAULT_CONFIG.truth_path)
    parser.add_argument("--artifacts", type=Path, default=DEFAULT_CONFIG.artifact_directory)
    args = parser.parse_args()
    try:
        pipeline, metadata, feature_names = load_artifact(args.artifacts)
        config = TrainingConfig(**metadata["training_config"])
        metrics, _ = evaluate_official_test(
            pipeline,
            load_cmapss_trajectory(args.test),
            load_official_rul(args.rul),
            feature_names,
            config=config,
            model_name=metadata["model_name"],
        )
    except (DataValidationError, ModelArtifactError, OSError, ValueError) as exc:
        print(f"EVALUATION_FAILED: {exc}", file=sys.stderr)
        return 2
    print(json.dumps(asdict(metrics), indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
