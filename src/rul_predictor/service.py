"""Cached typed backend service: the sole future-frontend integration boundary."""

from dataclasses import fields
import numpy as np
import pandas as pd

from .artifacts import load_artifact
from .config import BackendConfig, DEFAULT_CONFIG, TrainingConfig
from .exceptions import (
    DataValidationError,
    FeatureSchemaError,
    ModelArtifactError,
    ModelNotTrainedError,
    TrajectoryValidationError,
)
from .explainability import recent_sensor_changes
from .features import model_feature_names, prepare_feature_matrix
from .maintenance import maintenance_status
from .schemas import (
    ArtifactMode,
    ArtifactState,
    BackendState,
    BackendStatus,
    DatasetState,
    EvaluationResult,
    EvaluationSummary,
    FRONTEND_CONTRACT_VERSION,
    MachineSummary,
    MetricsState,
    ModelMetadata,
    ModelState,
    PredictionRequest,
    PredictionResult,
    ValidationReport,
)
from .validation import assess_trajectory_frame
from .uncertainty import validation_based_range


def _evaluation_from_dict(value: dict) -> EvaluationResult:
    allowed = {item.name for item in fields(EvaluationResult)}
    return EvaluationResult(**{key: item for key, item in value.items() if key in allowed})


class RULService:
    """Load one trusted artifact once and expose stable typed operations."""

    def __init__(self, config: BackendConfig = DEFAULT_CONFIG) -> None:
        self.config = config
        self._pipeline = None
        self._metadata: dict | None = None
        self._feature_names: list[str] | None = None
        self._load_error: ModelArtifactError | None = None
        self._load_artifact_once()

    def _load_artifact_once(self) -> None:
        try:
            self._pipeline, self._metadata, self._feature_names = load_artifact(
                self.config.artifact_directory,
                expected_mode=self.config.mode,
            )
        except ModelArtifactError as exc:
            self._load_error = exc

    def get_status(self) -> BackendStatus:
        dataset_available = all(
            path.is_file()
            for path in (self.config.train_path, self.config.test_path, self.config.truth_path)
        )
        if self._pipeline is None:
            artifact_files_exist = self.config.artifact_directory.exists() and any(
                self.config.artifact_directory.iterdir()
            )
            return BackendStatus(
                contract_version=FRONTEND_CONTRACT_VERSION,
                backend_state=BackendState.SOFTWARE_READY,
                dataset_state=(
                    DatasetState.SYNTHETIC_DEMO_DATA
                    if self.config.mode == ArtifactMode.DEMO
                    else DatasetState.REAL_DATASET_VALIDATED
                    if dataset_available
                    else DatasetState.REAL_DATASET_REQUIRED
                ),
                model_state=ModelState.MODEL_NOT_TRAINED,
                artifact_state=(
                    ArtifactState.ARTIFACT_INVALID
                    if artifact_files_exist
                    else ArtifactState.ARTIFACT_UNAVAILABLE
                ),
                metrics_state=MetricsState.FINAL_METRICS_UNAVAILABLE,
                prediction_available=False,
                demo_only=self.config.mode == ArtifactMode.DEMO,
                message=str(self._load_error or "No trained model artifact is available."),
            )
        final_available = bool(self._metadata and self._metadata.get("final_test_metrics"))
        demo_only = bool(self._metadata and self._metadata.get("demo_only"))
        return BackendStatus(
            contract_version=FRONTEND_CONTRACT_VERSION,
            backend_state=BackendState.SOFTWARE_READY,
            dataset_state=(
                DatasetState.SYNTHETIC_DEMO_DATA
                if demo_only
                else DatasetState.REAL_DATASET_VALIDATED
            ),
            model_state=ModelState.DEMO_MODEL_TRAINED if demo_only else ModelState.REAL_MODEL_TRAINED,
            artifact_state=(
                ArtifactState.DEMO_ARTIFACT_AVAILABLE
                if demo_only
                else ArtifactState.REAL_ARTIFACT_AVAILABLE
            ),
            metrics_state=(
                MetricsState.DEMO_METRICS_NOT_PUBLISHABLE
                if demo_only
                else MetricsState.FINAL_METRICS_AVAILABLE
                if final_available
                else MetricsState.FINAL_METRICS_UNAVAILABLE
            ),
            prediction_available=True,
            demo_only=demo_only,
            message=(
                "Synthetic demonstration model; metrics are not publishable."
                if demo_only
                else "Backend is ready."
                if final_available
                else "Real model is usable; final official metrics are unavailable."
            ),
        )

    def validate_dataset(self, data: pd.DataFrame) -> ValidationReport:
        _, report = assess_trajectory_frame(
            data,
            self.config.schema,
            minimum_history=self.config.schema.minimum_trajectory_length,
        )
        return report

    def list_machine_ids(self, data: pd.DataFrame) -> tuple[int | str, ...]:
        validated, _ = assess_trajectory_frame(
            data,
            self.config.schema,
            minimum_history=self.config.schema.minimum_trajectory_length,
        )
        return tuple(int(value) for value in sorted(validated[self.config.schema.machine_id].unique()))

    def describe_machine(self, data: pd.DataFrame, machine_id: int | str) -> MachineSummary:
        validated, report = assess_trajectory_frame(data, self.config.schema)
        matching = validated[validated[self.config.schema.machine_id].astype(str) == str(machine_id)]
        if matching.empty:
            raise TrajectoryValidationError(f"Machine '{machine_id}' is not present in the dataset.")
        return MachineSummary(
            machine_id=machine_id,
            observation_count=len(matching),
            first_cycle=int(matching[self.config.schema.cycle].iloc[0]),
            latest_cycle=int(matching[self.config.schema.cycle].iloc[-1]),
            latest_sensor_values={
                name: float(matching[name].iloc[-1]) for name in self.config.schema.sensor_columns
            },
            warnings=report.warnings,
            available_sensor_columns=self.config.schema.sensor_columns,
            recent_changes=recent_sensor_changes(matching, self.config.schema),
            prediction_ready=(
                len(matching) >= self.config.training.minimum_history
                and self.get_status().prediction_available
            ),
        )

    def get_model_metadata(self) -> ModelMetadata:
        if self._metadata is None:
            raise ModelNotTrainedError(str(self._load_error or "No trained model artifact is available."))
        return ModelMetadata(
            model_name=self._metadata["model_name"],
            model_version=self._metadata["model_version"],
            dataset_name=self._metadata["dataset_name"],
            dataset_subset=self._metadata["dataset_subset"],
            rul_unit=self._metadata["rul_unit"],
            feature_names=tuple(self._metadata["feature_names"]),
            removed_features=tuple(self._metadata["removed_features"]),
            training_data_kind=self._metadata.get("training_data_kind", "real"),
            demo_only=bool(self._metadata.get("demo_only", False)),
            metrics_publishable=bool(self._metadata.get("metrics_publishable", True)),
            raw=dict(self._metadata),
        )

    def get_evaluation_summary(self) -> EvaluationSummary:
        metadata = self.get_model_metadata().raw
        validation = tuple(
            _evaluation_from_dict(value) for value in metadata["validation_metrics"].values()
        )
        final_raw = metadata.get("final_test_metrics")
        final = _evaluation_from_dict(final_raw) if final_raw else None
        return EvaluationSummary(
            metrics_state=(
                MetricsState.DEMO_METRICS_NOT_PUBLISHABLE
                if metadata.get("demo_only")
                else MetricsState.FINAL_METRICS_AVAILABLE
                if final
                else MetricsState.FINAL_METRICS_UNAVAILABLE
            ),
            final_test=final,
            validation_models=validation,
            message="Final official metrics are available." if final else "FINAL_METRICS_UNAVAILABLE",
        )

    def predict(self, request: PredictionRequest) -> PredictionResult:
        if self._pipeline is None or self._metadata is None or self._feature_names is None:
            raise ModelNotTrainedError(str(self._load_error or "No trained model artifact is available."))
        training_config = TrainingConfig(**self._metadata["training_config"])
        validated, report = assess_trajectory_frame(
            request.trajectory,
            self.config.schema,
            minimum_history=training_config.minimum_history,
            require_single_machine=True,
        )
        observed_machine = int(validated[self.config.schema.machine_id].iloc[0])
        if str(request.machine_id) != str(observed_machine):
            raise TrajectoryValidationError(
                f"Request machine_id '{request.machine_id}' does not match trajectory machine {observed_machine}."
            )
        expected = model_feature_names(self.config.schema, training_config.rolling_window)
        if self._feature_names != expected:
            raise FeatureSchemaError(
                f"Input features do not match model version {self._metadata['model_version']}."
            )
        features = prepare_feature_matrix(
            validated, config=training_config, schema=self.config.schema
        )
        latest = features.iloc[[-1]]
        prediction = max(0.0, float(np.asarray(self._pipeline.predict(latest))[0]))
        warnings = list(report.warnings)
        ranges = self._metadata.get("training_ranges", {})
        out_of_range: list[str] = []
        for name in self._feature_names:
            if name not in ranges:
                continue
            value = float(latest.iloc[0][name])
            minimum, maximum = ranges[name]
            if value < minimum or value > maximum:
                out_of_range.append(name)
        if out_of_range:
            warnings.append(
                "Latest values fall outside the training range for: "
                + ", ".join(out_of_range[:8])
                + ("." if len(out_of_range) <= 8 else ", and additional features.")
            )
        lower, upper = validation_based_range(prediction, self._metadata.get("prediction_range"))
        if self._metadata.get("demo_only"):
            warnings.append(
                "Synthetic demonstration mode: prediction and metrics are not publishable."
            )
        return PredictionResult(
            machine_id=request.machine_id,
            observed_through_cycle=int(validated[self.config.schema.cycle].iloc[-1]),
            predicted_rul=round(prediction, 2),
            rul_unit=self._metadata["rul_unit"],
            maintenance_status=maintenance_status(prediction, self.config.maintenance),
            lower_bound=round(lower, 2) if lower is not None else None,
            upper_bound=round(upper, 2) if upper is not None else None,
            warnings=tuple(warnings),
            important_features=tuple(self._metadata.get("important_features", ())),
            recent_changes=recent_sensor_changes(validated, self.config.schema),
            model_name=self._metadata["model_name"],
            model_version=self._metadata["model_version"],
        )
