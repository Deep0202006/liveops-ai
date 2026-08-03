"""Verify real readiness or the complete isolated demo integration workflow."""

import argparse
import json
import sys
from pathlib import Path
from tempfile import TemporaryDirectory
from time import perf_counter

import pandas as pd

from rul_predictor.artifacts import load_artifact
from rul_predictor.config import BackendConfig, DEFAULT_CONFIG
from rul_predictor.data_loading import load_cmapss_trajectory
from rul_predictor.demo import build_demo_artifact, generate_synthetic_trajectories
from rul_predictor.exceptions import ModelArtifactError, RULPredictorError
from rul_predictor.schemas import ArtifactMode, DatasetState, PredictionRequest
from rul_predictor.service import RULService


def _real_report() -> tuple[dict[str, object], int]:
    status = RULService(DEFAULT_CONFIG).get_status()
    report = {**status.to_dict(), "verification": "EXPECTED_REAL_DATA_BLOCKER"}
    ready = status.dataset_state == DatasetState.REAL_DATASET_VALIDATED
    return report, 0 if ready and status.prediction_available else 2


def _verify_demo(artifact_directory: Path, sample_directory: Path) -> dict[str, object]:
    started = perf_counter()
    build = build_demo_artifact(artifact_directory, sample_directory)
    training_and_build_seconds = perf_counter() - started
    config = BackendConfig(artifact_directory=artifact_directory, mode=ArtifactMode.DEMO)
    load_started = perf_counter()
    service = RULService(config)
    load_seconds = perf_counter() - load_started
    data = generate_synthetic_trajectories(machine_count=2, first_machine_id=7001)
    validation = service.validate_dataset(data)
    machine_ids = service.list_machine_ids(data)
    machine = data[data[config.schema.machine_id] == machine_ids[0]]
    summary = service.describe_machine(data, machine_ids[0])
    prediction_started = perf_counter()
    prediction = service.predict(PredictionRequest(machine_ids[0], machine))
    first_prediction_seconds = perf_counter() - prediction_started
    repeated_started = perf_counter()
    repeated = service.predict(PredictionRequest(machine_ids[0], machine))
    repeated_prediction_seconds = perf_counter() - repeated_started
    status = service.get_status()
    metadata = service.get_model_metadata()
    evaluation = service.get_evaluation_summary()
    load_artifact(artifact_directory, expected_mode=ArtifactMode.DEMO)
    mode_isolation = False
    try:
        load_artifact(artifact_directory, expected_mode=ArtifactMode.REAL)
    except ModelArtifactError:
        mode_isolation = True
    checks = {
        "configuration": config.training.random_seed == 42,
        "demo_artifact_integrity": True,
        "service_startup": status.prediction_available and status.demo_only,
        "dataset_validation": validation.valid,
        "machine_listing": len(machine_ids) == 2,
        "machine_summary": summary.latest_cycle > summary.first_cycle,
        "prediction": prediction.predicted_rul >= 0,
        "prediction_range": (
            prediction.lower_bound is not None
            and prediction.lower_bound <= prediction.predicted_rul <= prediction.upper_bound
        ),
        "maintenance_status": prediction.maintenance_status
        in {"HEALTHY", "MONITOR", "PLAN_MAINTENANCE", "CRITICAL"},
        "explainability": 0 < len(prediction.important_features) <= 5,
        "serialization": isinstance(prediction.to_dict(), dict),
        "evaluation_summary": evaluation.metrics_state.value == "DEMO_METRICS_NOT_PUBLISHABLE",
        "metadata_demo_labels": (
            metadata.training_data_kind == "synthetic"
            and metadata.demo_only
            and not metadata.metrics_publishable
        ),
        "repeated_prediction": prediction.to_dict() == repeated.to_dict(),
        "demo_real_isolation": mode_isolation,
        "real_model_absent_without_fallback": not RULService(DEFAULT_CONFIG).get_status().prediction_available,
    }
    if not all(checks.values()):
        failed = [name for name, passed in checks.items() if not passed]
        raise RuntimeError("Release checks failed: " + ", ".join(failed))
    return {
        "verification": "VERIFIED_DEMO_ONLY",
        "checks": checks,
        "status": status.to_dict(),
        "prediction": prediction.to_dict(),
        "performance": {
            "demo_training_and_build_seconds": round(training_and_build_seconds, 4),
            "artifact_load_seconds": round(load_seconds, 4),
            "first_prediction_seconds": round(first_prediction_seconds, 4),
            "repeated_prediction_seconds": round(repeated_prediction_seconds, 4),
            "artifact_size_bytes": build.artifact_size_bytes,
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=("real", "demo"), default="real")
    parser.add_argument("--full", action="store_true")
    parser.add_argument("--artifacts", type=Path, default=Path("artifacts/demo"))
    args = parser.parse_args()
    try:
        if args.full:
            with TemporaryDirectory(prefix="liveops-backend-rc-") as directory:
                root = Path(directory)
                report = _verify_demo(root / "artifacts" / "demo", root / "data" / "sample")
            print(json.dumps(report, indent=2))
            return 0
        if args.mode == "demo":
            report = _verify_demo(args.artifacts, Path("data/sample"))
            print(json.dumps(report, indent=2))
            return 0
        report, exit_code = _real_report()
        print(json.dumps(report, indent=2))
        return exit_code
    except (RULPredictorError, OSError, ValueError, RuntimeError) as exc:
        print(f"BACKEND_VERIFICATION_FAILED: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
