from dataclasses import replace

import pytest

from rul_predictor.config import BackendConfig, MaintenanceConfig
from rul_predictor.exceptions import ModelNotTrainedError, TrajectoryValidationError
from rul_predictor.schemas import ArtifactState, DatasetState, MetricsState, PredictionRequest
from rul_predictor.service import RULService


def test_missing_model_has_explicit_state(tmp_path, schema, trajectories):
    service = RULService(BackendConfig(schema=schema, data_directory=tmp_path / "raw", artifact_directory=tmp_path))
    status = service.get_status()
    assert status.dataset_state == DatasetState.REAL_DATASET_REQUIRED
    assert not status.prediction_available
    with pytest.raises(ModelNotTrainedError):
        service.predict(PredictionRequest(1, trajectories[trajectories[schema.machine_id] == 1]))


def test_partial_artifact_has_invalid_state(tmp_path, schema):
    (tmp_path / "metadata.json").write_text("{}", encoding="utf-8")
    service = RULService(BackendConfig(schema=schema, artifact_directory=tmp_path))
    assert service.get_status().artifact_state == ArtifactState.ARTIFACT_INVALID


def test_service_returns_typed_prediction_range_explanations_and_reuses_model(
    trained_backend, trajectories, schema
):
    backend_config, _ = trained_backend
    service = RULService(backend_config)
    pipeline_identity = id(service._pipeline)
    history = trajectories[trajectories[schema.machine_id] == 1]
    first = service.predict(PredictionRequest(1, history))
    second = service.predict(PredictionRequest(1, history))
    assert id(service._pipeline) == pipeline_identity
    assert first == second
    assert first.predicted_rul >= 0
    assert first.rul_unit == "cycles"
    assert first.lower_bound is not None and first.lower_bound >= 0
    assert first.upper_bound is not None and first.upper_bound >= first.lower_bound
    assert first.important_features
    assert first.recent_changes
    assert first.model_version == "1.0.0"


def test_service_rejects_multiple_or_mismatched_machines(trained_backend, trajectories, schema):
    service = RULService(trained_backend[0])
    with pytest.raises(TrajectoryValidationError, match="exactly one machine"):
        service.predict(PredictionRequest(1, trajectories))
    history = trajectories[trajectories[schema.machine_id] == 1]
    with pytest.raises(TrajectoryValidationError, match="does not match"):
        service.predict(PredictionRequest(2, history))


def test_service_warns_out_of_training_range_and_calculates_status(
    trained_backend, trajectories, schema
):
    backend_config, _ = trained_backend
    service = RULService(
        replace(
            backend_config,
            maintenance=MaintenanceConfig(
                urgent_at_or_below=10_000,
                plan_at_or_below=20_000,
                monitor_at_or_below=30_000,
            ),
        )
    )
    history = trajectories[trajectories[schema.machine_id] == 1].copy()
    history.loc[history.index[-1], "sensor_1"] = 1_000_000
    result = service.predict(PredictionRequest(1, history))
    assert result.maintenance_status == "CRITICAL"
    assert any("outside the training range" in warning for warning in result.warnings)


def test_metadata_and_evaluation_summary_are_typed(trained_backend):
    service = RULService(trained_backend[0])
    metadata = service.get_model_metadata()
    evaluation = service.get_evaluation_summary()
    assert metadata.dataset_subset == "SOFTWARE_TEST_ONLY"
    assert len(evaluation.validation_models) == 3
    assert evaluation.metrics_state == MetricsState.DEMO_METRICS_NOT_PUBLISHABLE
