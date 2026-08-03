"""Generate frontend JSON examples from actual typed service calls."""

import json
import shutil
import sys
from pathlib import Path
from tempfile import TemporaryDirectory

import pandas as pd

from rul_predictor.artifacts import MODEL_FILE, load_artifact
from rul_predictor.config import BackendConfig, DEFAULT_CONFIG
from rul_predictor.exceptions import RULPredictorError
from rul_predictor.schemas import ArtifactMode, PredictionRequest
from rul_predictor.service import RULService


def _write(directory: Path, name: str, value: object) -> None:
    directory.mkdir(parents=True, exist_ok=True)
    (directory / name).write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")


def _error(callable_object) -> dict[str, object]:
    try:
        callable_object()
    except RULPredictorError as exc:
        return exc.to_error_result().to_dict()
    raise RuntimeError("The expected frontend-safe error did not occur.")


def main() -> int:
    output = Path("docs/frontend-integration/examples")
    artifacts = Path("artifacts/demo")
    sample = Path("data/sample/demo_machine_monitor.csv")
    if not artifacts.is_dir() or not sample.is_file():
        print("EXAMPLES_FAILED: run python scripts/build_demo_artifact.py first.", file=sys.stderr)
        return 2
    service = RULService(BackendConfig(artifact_directory=artifacts, mode=ArtifactMode.DEMO))
    frame = pd.read_csv(sample)
    machine_id = service.list_machine_ids(frame)[0]
    _write(output, "backend-unavailable.json", RULService(DEFAULT_CONFIG).get_status().to_dict())
    _write(output, "demo-mode-status.json", service.get_status().to_dict())
    _write(output, "successful-prediction.json", service.predict(PredictionRequest(machine_id, frame)).to_dict())
    _write(output, "evaluation-summary.json", service.get_evaluation_summary().to_dict())
    _write(output, "model-metadata.json", service.get_model_metadata().to_dict())
    _write(output, "validation-failure.json", _error(lambda: service.validate_dataset(frame.drop(columns=["sensor_1"]))))
    _write(output, "insufficient-history.json", _error(lambda: service.predict(PredictionRequest(machine_id, frame.head(1)))))
    with TemporaryDirectory(prefix="liveops-corrupt-example-") as directory:
        corrupt = Path(directory)
        shutil.copytree(artifacts, corrupt, dirs_exist_ok=True)
        (corrupt / MODEL_FILE).write_bytes(b"corrupted-for-contract-example")
        _write(output, "artifact-corruption.json", _error(lambda: load_artifact(corrupt, expected_mode=ArtifactMode.DEMO)))
    print(f"FRONTEND_EXAMPLES_WRITTEN: {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
