"""Train a leakage-safe model from NASA C-MAPSS FD001 training trajectories."""

import argparse
import json
import sys
from pathlib import Path

from rul_predictor.artifacts import save_artifact
from rul_predictor.config import DEFAULT_CONFIG, TrainingConfig
from rul_predictor.data_loading import load_cmapss_trajectory
from rul_predictor.data_loading import load_official_rul
from rul_predictor.exceptions import DataValidationError, ModelArtifactError
from rul_predictor.training import evaluate_official_test, train_and_select


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--train", type=Path, default=DEFAULT_CONFIG.train_path)
    parser.add_argument("--test", type=Path, default=DEFAULT_CONFIG.test_path)
    parser.add_argument("--rul", type=Path, default=DEFAULT_CONFIG.truth_path)
    parser.add_argument("--artifacts", type=Path, default=DEFAULT_CONFIG.artifact_directory)
    args = parser.parse_args()
    try:
        config = TrainingConfig()
        result = train_and_select(
            load_cmapss_trajectory(args.train),
            config=config,
            dataset_subset=DEFAULT_CONFIG.dataset_subset,
        )
        test_frame = load_cmapss_trajectory(args.test)
        official_rul = load_official_rul(args.rul)
        final_metrics, evidence = evaluate_official_test(
            result.pipeline,
            test_frame,
            official_rul,
            result.feature_names,
            config=config,
            model_name=result.selected_model,
        )
        test_machine_count = int(evidence["machine_id"].nunique())
        args.artifacts.mkdir(parents=True, exist_ok=True)
        metadata = save_artifact(
            result,
            args.artifacts,
            dataset_name=DEFAULT_CONFIG.dataset_name,
            dataset_subset=DEFAULT_CONFIG.dataset_subset,
            config=config,
            final_test_metrics=final_metrics,
            test_machine_count=test_machine_count,
        )
    except (DataValidationError, ModelArtifactError, OSError, ValueError) as exc:
        print(f"TRAINING_FAILED: {exc}", file=sys.stderr)
        return 2
    print(
        json.dumps(
            {
                "state": "TRAINING_COMPLETE",
                "model": metadata["model_name"],
                "artifact_directory": str(args.artifacts),
                "final_test": metadata["final_test_metrics"],
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
