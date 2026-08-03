"""Validate authorized C-MAPSS files without training a model."""

import argparse
import json
import sys
from pathlib import Path

from rul_predictor.config import DEFAULT_CONFIG
from rul_predictor.data_loading import load_cmapss_trajectory, load_official_rul
from rul_predictor.exceptions import DataValidationError
from rul_predictor.validation import assess_trajectory_frame


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--train", type=Path, default=DEFAULT_CONFIG.train_path)
    parser.add_argument("--test", type=Path, default=DEFAULT_CONFIG.test_path)
    parser.add_argument("--rul", type=Path, default=DEFAULT_CONFIG.truth_path)
    args = parser.parse_args()
    try:
        train, train_report = assess_trajectory_frame(
            load_cmapss_trajectory(args.train), DEFAULT_CONFIG.schema
        )
        test, test_report = assess_trajectory_frame(
            load_cmapss_trajectory(args.test), DEFAULT_CONFIG.schema
        )
        truth = load_official_rul(args.rul)
        if len(truth) != test_report.machine_count:
            raise DataValidationError(
                "Official RUL label count does not match the number of test machines."
            )
    except (DataValidationError, OSError, ValueError) as exc:
        print(f"REAL_DATASET_REQUIRED: {exc}", file=sys.stderr)
        print(
            "Expected authorized files: "
            f"{args.train}, {args.test}, {args.rul}",
            file=sys.stderr,
        )
        return 2
    print(
        json.dumps(
            {
                "state": "DATASET_VALID",
                "subset": DEFAULT_CONFIG.dataset_subset,
                "train_machines": train_report.machine_count,
                "train_observations": len(train),
                "test_machines": test_report.machine_count,
                "test_observations": len(test),
                "truth_labels": len(truth),
                "warnings": [*train_report.warnings, *test_report.warnings],
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
