import json

import pytest

from rul_predictor.artifacts import SCHEMA_FILE, load_artifact, save_artifact
from rul_predictor.config import TrainingConfig
from rul_predictor.exceptions import ArtifactError, DataValidationError
from rul_predictor.inference import predict_latest
from rul_predictor.training import train_and_select


def test_synthetic_software_flow_trains_saves_loads_and_predicts(tmp_path, trajectories, schema):
    config = TrainingConfig(random_seed=9, validation_fraction=0.2, rul_cap=None, rolling_window=3, minimum_history=3)
    result = train_and_select(trajectories, config=config, schema=schema)
    metadata = save_artifact(result, tmp_path, dataset_name="synthetic-test-fixture", config=config)
    pipeline, loaded_metadata, feature_names = load_artifact(tmp_path)
    assert pipeline is not None
    assert loaded_metadata == metadata
    assert feature_names == result.feature_names
    history = trajectories[trajectories[schema.machine_id] == 1]
    prediction = predict_latest(history, tmp_path, schema=schema)
    assert prediction["predicted_rul"] >= 0
    assert prediction["rul_unit"] == "cycles"
    assert prediction["uncertainty_notice"]


def test_inference_rejects_short_history_and_missing_artifact(tmp_path, trajectories, schema):
    history = trajectories[trajectories[schema.machine_id] == 1]
    with pytest.raises(ArtifactError, match="incomplete"):
        predict_latest(history, tmp_path, schema=schema)

    config = TrainingConfig(rolling_window=3, minimum_history=5)
    result = train_and_select(trajectories, config=config, schema=schema)
    save_artifact(result, tmp_path, dataset_name="synthetic-test-fixture", config=config)
    with pytest.raises(DataValidationError, match="At least 5 observations"):
        predict_latest(history.head(2), tmp_path, schema=schema)


def test_schema_tampering_is_rejected(tmp_path, trajectories, schema):
    config = TrainingConfig(rolling_window=3, minimum_history=3)
    result = train_and_select(trajectories, config=config, schema=schema)
    save_artifact(result, tmp_path, dataset_name="synthetic-test-fixture", config=config)
    schema_path = tmp_path / SCHEMA_FILE
    content = json.loads(schema_path.read_text(encoding="utf-8"))
    content["feature_names"] = ["wrong"]
    schema_path.write_text(json.dumps(content), encoding="utf-8")
    history = trajectories[trajectories[schema.machine_id] == 1]
    with pytest.raises(ArtifactError, match="feature schema"):
        predict_latest(history, tmp_path, schema=schema)
