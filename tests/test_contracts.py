from dataclasses import FrozenInstanceError
import json

import pytest

from rul_predictor.config import BackendConfig, DatasetSchema, MaintenanceConfig, TrainingConfig
from rul_predictor.exceptions import InsufficientHistoryError
from rul_predictor.schemas import (
    ArtifactState,
    BackendState,
    DatasetState,
    ErrorCode,
    MetricsState,
    ModelState,
)
from rul_predictor.service import RULService


def test_configuration_is_immutable_and_rejects_invalid_values():
    config = TrainingConfig()
    with pytest.raises(FrozenInstanceError):
        config.random_seed = 9
    with pytest.raises(ValueError, match="cycle-based"):
        DatasetSchema(rul_unit="hours")
    with pytest.raises(ValueError, match="rolling_window"):
        TrainingConfig(rolling_window=1)
    with pytest.raises(ValueError, match="strictly ordered"):
        MaintenanceConfig(urgent_at_or_below=50, plan_at_or_below=25)


def test_no_data_status_is_complete_stable_and_json_safe(tmp_path, schema):
    status = RULService(
        BackendConfig(schema=schema, data_directory=tmp_path / "raw", artifact_directory=tmp_path)
    ).get_status()
    assert status.backend_state == BackendState.SOFTWARE_READY
    assert status.dataset_state == DatasetState.REAL_DATASET_REQUIRED
    assert status.model_state == ModelState.MODEL_NOT_TRAINED
    assert status.artifact_state == ArtifactState.ARTIFACT_UNAVAILABLE
    assert status.metrics_state == MetricsState.FINAL_METRICS_UNAVAILABLE
    assert not status.prediction_available and not status.demo_only
    assert json.loads(json.dumps(status.to_dict())) == status.to_dict()


def test_expected_error_has_stable_serializable_contract():
    error = InsufficientHistoryError("At least five observations are required.")
    payload = error.to_error_result().to_dict()
    assert payload == {
        "code": ErrorCode.INSUFFICIENT_HISTORY.value,
        "message": "At least five observations are required.",
        "recoverable": True,
        "safe_details": {},
    }
