import json
from pathlib import Path

import pandas as pd
import pytest

from rul_predictor.config import BackendConfig
from rul_predictor.demo import build_demo_artifact, generate_synthetic_trajectories
from rul_predictor.exceptions import ModelNotTrainedError
from rul_predictor.schemas import (
    ArtifactMode,
    ArtifactState,
    DatasetState,
    MetricsState,
    ModelState,
    PredictionRequest,
)
from rul_predictor.service import RULService


@pytest.fixture(scope="module")
def demo_build(tmp_path_factory):
    root = tmp_path_factory.mktemp("explicit-demo")
    artifact_directory = root / "artifacts" / "demo"
    sample_directory = root / "data" / "sample"
    result = build_demo_artifact(artifact_directory, sample_directory)
    config = BackendConfig(
        artifact_directory=artifact_directory,
        mode=ArtifactMode.DEMO,
        dataset_name="LiveOps deterministic synthetic integration data",
        dataset_subset="DEMO_V1",
    )
    return result, config, sample_directory


def test_generator_is_deterministic_and_clearly_multi_machine():
    first = generate_synthetic_trajectories()
    second = generate_synthetic_trajectories()
    pd.testing.assert_frame_equal(first, second)
    assert first["machine_id"].nunique() == 12
    assert first.groupby("machine_id")["cycle"].min().eq(1).all()


def test_demo_status_metadata_evaluation_and_serialization(demo_build):
    result, config, _ = demo_build
    service = RULService(config)
    status = service.get_status()
    assert status.dataset_state == DatasetState.SYNTHETIC_DEMO_DATA
    assert status.model_state == ModelState.DEMO_MODEL_TRAINED
    assert status.artifact_state == ArtifactState.DEMO_ARTIFACT_AVAILABLE
    assert status.metrics_state == MetricsState.DEMO_METRICS_NOT_PUBLISHABLE
    assert status.prediction_available and status.demo_only
    metadata = service.get_model_metadata()
    assert metadata.training_data_kind == "synthetic"
    assert metadata.demo_only and not metadata.metrics_publishable
    assert metadata.raw["scientific_validity"] == "software-verification-only"
    assert service.get_evaluation_summary().metrics_state == MetricsState.DEMO_METRICS_NOT_PUBLISHABLE
    json.dumps(status.to_dict())
    assert result.artifact_size_bytes > 0


def test_generated_samples_validate_and_produce_distinct_model_statuses(demo_build):
    result, config, sample_directory = demo_build
    service = RULService(config)
    observed = {}
    for filename in result.sample_statuses:
        frame = pd.read_csv(sample_directory / filename)
        assert service.validate_dataset(frame).valid
        machine_id = service.list_machine_ids(frame)[0]
        summary = service.describe_machine(frame, machine_id)
        prediction = service.predict(PredictionRequest(machine_id, frame))
        assert summary.latest_cycle == prediction.observed_through_cycle
        assert prediction.lower_bound <= prediction.predicted_rul <= prediction.upper_bound
        assert len(prediction.important_features) <= 5
        assert any("not publishable" in warning for warning in prediction.warnings)
        observed[filename] = prediction.maintenance_status
        json.dumps(prediction.to_dict())
    assert observed == result.sample_statuses
    assert len(set(observed.values())) == 3


def test_no_demo_to_real_fallback(demo_build):
    _, demo_config, _ = demo_build
    real_service = RULService(
        BackendConfig(
            artifact_directory=demo_config.artifact_directory,
            mode=ArtifactMode.REAL,
        )
    )
    assert real_service.get_status().artifact_state == ArtifactState.ARTIFACT_INVALID
    with pytest.raises(ModelNotTrainedError):
        real_service.get_model_metadata()


def test_demo_builder_refuses_real_artifact_location(tmp_path):
    with pytest.raises(ValueError, match="real artifact"):
        build_demo_artifact(Path("artifacts/real"), tmp_path)
