"""Versioned trusted-local model artifact management."""

import json
import platform
from hashlib import sha256
from dataclasses import asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import joblib
import pandas
import sklearn

from .version import __version__
from .config import MaintenanceConfig, TrainingConfig
from .exceptions import ArtifactError
from .exceptions import FeatureSchemaError, ModelArtifactError, ModelNotTrainedError
from .schemas import ArtifactMode, ErrorCode, EvaluationResult
from .training import TrainingResult

MODEL_FILE = "model.joblib"
METADATA_FILE = "metadata.json"
SCHEMA_FILE = "feature_schema.json"
EVALUATION_FILE = "evaluation.json"
INTEGRITY_FILE = "manifest.json"

REQUIRED_METADATA_FIELDS = {
    "model_name",
    "model_version",
    "dataset_name",
    "dataset_subset",
    "dataset_fingerprint",
    "target_formula",
    "rul_unit",
    "rul_cap",
    "feature_names",
    "removed_features",
    "feature_configuration",
    "split_method",
    "random_seed",
    "training_machine_count",
    "validation_machine_count",
    "test_machine_count",
    "prediction_range",
    "training_date_utc",
    "training_data_kind",
    "demo_only",
    "metrics_publishable",
    "scientific_validity",
    "maintenance_thresholds",
}


def _schema_hash(feature_names: list[str]) -> str:
    return sha256(json.dumps(feature_names, separators=(",", ":")).encode("utf-8")).hexdigest()


def _file_hash(path: Path) -> str:
    digest = sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _evaluation_dict(result: EvaluationResult | dict[str, float] | None) -> dict[str, Any] | None:
    if result is None:
        return None
    return asdict(result) if isinstance(result, EvaluationResult) else dict(result)


def save_artifact(
    result: TrainingResult,
    directory: Path,
    *,
    dataset_name: str,
    dataset_subset: str = "FD001",
    config: TrainingConfig,
    final_test_metrics: EvaluationResult | dict[str, float] | None = None,
    test_machine_count: int = 0,
    training_data_kind: str = "real",
    demo_only: bool = False,
    metrics_publishable: bool = True,
    scientific_validity: str = "authorized-run-to-failure-dataset",
    maintenance: MaintenanceConfig | None = None,
) -> dict[str, Any]:
    """Save a pipeline and human-readable provenance; never accepts an uploaded model."""

    directory.mkdir(parents=True, exist_ok=True)
    if training_data_kind not in {"real", "synthetic"}:
        raise ValueError("training_data_kind must be 'real' or 'synthetic'.")
    if (training_data_kind == "synthetic") != demo_only:
        raise ValueError("Synthetic artifacts must be demo-only; real artifacts must not be demo-only.")
    if demo_only and metrics_publishable:
        raise ValueError("Synthetic demonstration metrics cannot be publishable.")
    maintenance = maintenance or MaintenanceConfig()
    metadata: dict[str, Any] = {
        "model_name": result.selected_model,
        "model_version": __version__,
        "dataset_name": dataset_name,
        "dataset_subset": dataset_subset,
        "dataset_fingerprint": result.dataset_fingerprint,
        "target_formula": "min(final_failure_cycle - current_cycle, cap)" if config.rul_cap else "final_failure_cycle - current_cycle",
        "target_strategy": "min(max_cycle - cycle, cap)" if config.rul_cap else "max_cycle - cycle",
        "rul_unit": "cycles",
        "rul_cap": config.rul_cap,
        "feature_names": result.feature_names,
        "removed_features": result.removed_features,
        "feature_configuration": {
            "rolling_window": config.rolling_window,
            "features": "current, trailing mean, trailing std, previous-cycle delta",
            "causal": True,
            "variance_threshold": config.variance_threshold,
        },
        "feature_schema_hash": _schema_hash(result.feature_names),
        "split_method": "machine-level train/validation; official dataset test split",
        "random_seed": config.random_seed,
        "training_machine_count": len(result.split.train_machine_ids),
        "validation_machine_count": len(result.split.validation_machine_ids),
        "test_machine_count": test_machine_count,
        "train_machine_ids": list(result.split.train_machine_ids),
        "validation_machine_ids": list(result.split.validation_machine_ids),
        "validation_metrics": {
            name: asdict(evaluation) for name, evaluation in result.validation_results.items()
        },
        "candidate_models": list(result.validation_results),
        "selection_rule": result.selection_rule,
        "selection_reason": result.selection_reason,
        "selected_model": result.selected_model,
        "final_test_metrics": _evaluation_dict(final_test_metrics),
        "prediction_range": result.prediction_interval,
        "important_features": list(result.important_features),
        "native_feature_importance": result.native_importance,
        "training_ranges": result.training_ranges,
        "training_seconds": result.training_seconds,
        "training_date_utc": datetime.now(timezone.utc).isoformat(),
        "python_version": platform.python_version(),
        "library_versions": {"pandas": pandas.__version__, "scikit_learn": sklearn.__version__},
        "training_config": asdict(config),
        "training_data_kind": training_data_kind,
        "demo_only": demo_only,
        "metrics_publishable": metrics_publishable,
        "scientific_validity": scientific_validity,
        "maintenance_thresholds": asdict(maintenance),
    }
    # Normalize tuples and other JSON-compatible values so the returned contract
    # exactly matches what subsequent processes load from disk.
    metadata = json.loads(json.dumps(metadata))
    joblib.dump(result.pipeline, directory / MODEL_FILE)
    (directory / METADATA_FILE).write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    (directory / SCHEMA_FILE).write_text(
        json.dumps(
            {
                "model_version": __version__,
                "feature_names": result.feature_names,
                "removed_features": result.removed_features,
                "feature_schema_hash": _schema_hash(result.feature_names),
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    (directory / EVALUATION_FILE).write_text(
        json.dumps(
            {
                "state": "VERIFIED" if final_test_metrics is not None else "FINAL_METRICS_UNAVAILABLE",
                "validation_models": metadata["validation_metrics"],
                "final_test": metadata["final_test_metrics"],
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    integrity = {
        "artifact_version": __version__,
        "model_identifier": f"{metadata['model_name']}:{metadata['model_version']}",
        "dataset_fingerprint": metadata["dataset_fingerprint"],
        "files": {
            name: _file_hash(directory / name)
            for name in (MODEL_FILE, METADATA_FILE, SCHEMA_FILE, EVALUATION_FILE)
        },
    }
    (directory / INTEGRITY_FILE).write_text(json.dumps(integrity, indent=2), encoding="utf-8")
    return metadata


def load_artifact(
    directory: Path, *, expected_mode: ArtifactMode | None = None
) -> tuple[Any, dict[str, Any], list[str]]:
    """Load only the configured local artifact after metadata/schema validation."""

    paths = [
        directory / MODEL_FILE,
        directory / METADATA_FILE,
        directory / SCHEMA_FILE,
        directory / EVALUATION_FILE,
        directory / INTEGRITY_FILE,
    ]
    missing = [path.name for path in paths if not path.is_file()]
    if missing:
        raise ModelNotTrainedError(f"Model artifact is incomplete; missing: {', '.join(missing)}")
    if (directory / MODEL_FILE).stat().st_size == 0:
        raise ModelArtifactError("The trusted local model file is empty.")
    try:
        metadata = json.loads((directory / METADATA_FILE).read_text(encoding="utf-8"))
        schema = json.loads((directory / SCHEMA_FILE).read_text(encoding="utf-8"))
        evaluation = json.loads((directory / EVALUATION_FILE).read_text(encoding="utf-8"))
        integrity = json.loads((directory / INTEGRITY_FILE).read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ModelArtifactError("Model metadata, feature schema, or evaluation data is unreadable.") from exc
    missing_metadata = sorted(REQUIRED_METADATA_FIELDS - metadata.keys())
    if missing_metadata:
        raise ModelArtifactError(
            f"Model metadata is incomplete; missing: {', '.join(missing_metadata)}"
        )
    if metadata.get("model_version") != __version__ or schema.get("model_version") != __version__:
        raise ModelArtifactError("The model artifact version is not supported by this application.")
    feature_names = schema.get("feature_names")
    if not isinstance(feature_names, list) or not feature_names:
        raise FeatureSchemaError("The feature schema does not contain a valid feature order.")
    expected_hash = _schema_hash(feature_names)
    if (
        schema.get("feature_schema_hash") != expected_hash
        or metadata.get("feature_schema_hash") != expected_hash
        or metadata.get("feature_names") != feature_names
    ):
        raise FeatureSchemaError(
            "The feature schema does not match model version "
            f"{metadata.get('model_version', 'unknown')}."
        )
    if not isinstance(evaluation, dict) or "state" not in evaluation:
        raise ModelArtifactError("Evaluation metadata is incomplete.")
    if not isinstance(integrity, dict) or not isinstance(integrity.get("files"), dict):
        raise ModelArtifactError("Artifact integrity manifest is incomplete.")
    if integrity.get("artifact_version") != __version__:
        raise ModelArtifactError("Artifact integrity version is not supported.")
    if integrity.get("dataset_fingerprint") != metadata["dataset_fingerprint"]:
        raise ModelArtifactError("Artifact dataset fingerprint does not match metadata.")
    if integrity.get("model_identifier") != f"{metadata['model_name']}:{metadata['model_version']}":
        raise ModelArtifactError("Artifact model identifier does not match metadata.")
    for name in (MODEL_FILE, METADATA_FILE, SCHEMA_FILE, EVALUATION_FILE):
        expected_hash = integrity["files"].get(name)
        if not expected_hash or _file_hash(directory / name) != expected_hash:
            raise ModelArtifactError(
                f"Artifact checksum mismatch for {name}.",
                code=ErrorCode.ARTIFACT_CORRUPTED,
            )
    data_kind = metadata["training_data_kind"]
    if data_kind not in {"real", "synthetic"}:
        raise ModelArtifactError("Artifact training data kind is not recognized.")
    coherent_demo = data_kind == "synthetic" and metadata["demo_only"] and not metadata["metrics_publishable"]
    coherent_real = data_kind == "real" and not metadata["demo_only"]
    if not (coherent_demo or coherent_real):
        raise ModelArtifactError("Artifact data-kind and metrics-state metadata are inconsistent.")
    if expected_mode is not None:
        actual_mode = ArtifactMode.DEMO if metadata["demo_only"] else ArtifactMode.REAL
        if actual_mode != expected_mode:
            raise ModelArtifactError(
                f"A {actual_mode.value} artifact cannot be loaded in {expected_mode.value} mode.",
                code=ErrorCode.ARTIFACT_MODE_MISMATCH,
            )
    try:
        pipeline = joblib.load(directory / MODEL_FILE)
    except Exception as exc:
        raise ModelArtifactError("The trusted local model pipeline could not be loaded.") from exc
    if getattr(pipeline, "n_features_in_", None) != len(feature_names):
        raise FeatureSchemaError("The model input width does not match the saved feature schema.")
    expected_estimators = {
        "dummy_median": "DummyRegressor",
        "ridge": "Ridge",
        "extra_trees": "ExtraTreesRegressor",
    }
    fitted_model = getattr(pipeline, "named_steps", {}).get("model")
    expected_class = expected_estimators.get(metadata["model_name"])
    if expected_class is None or fitted_model.__class__.__name__ != expected_class:
        raise ModelArtifactError("Model metadata does not agree with the fitted estimator.")
    return pipeline, metadata, feature_names
