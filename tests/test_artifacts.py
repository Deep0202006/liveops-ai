import json
import shutil
from hashlib import sha256

import pytest

from rul_predictor.artifacts import INTEGRITY_FILE, METADATA_FILE, MODEL_FILE, SCHEMA_FILE, load_artifact
from rul_predictor.schemas import ArtifactMode, ErrorCode
from rul_predictor.exceptions import FeatureSchemaError, ModelArtifactError, ModelNotTrainedError


def copy_artifact(source, destination):
    shutil.copytree(source, destination, dirs_exist_ok=True)


def refresh_hash(directory, filename):
    integrity_path = directory / INTEGRITY_FILE
    integrity = json.loads(integrity_path.read_text(encoding="utf-8"))
    integrity["files"][filename] = sha256((directory / filename).read_bytes()).hexdigest()
    integrity_path.write_text(json.dumps(integrity), encoding="utf-8")


def test_missing_corrupt_and_empty_artifacts_are_rejected(tmp_path, trained_backend):
    with pytest.raises(ModelNotTrainedError, match="missing"):
        load_artifact(tmp_path)
    copy_artifact(trained_backend[0].artifact_directory, tmp_path)
    (tmp_path / METADATA_FILE).write_text("{broken", encoding="utf-8")
    with pytest.raises(ModelArtifactError, match="unreadable"):
        load_artifact(tmp_path)
    copy_artifact(trained_backend[0].artifact_directory, tmp_path)
    (tmp_path / MODEL_FILE).write_bytes(b"")
    with pytest.raises(ModelArtifactError, match="empty"):
        load_artifact(tmp_path)


def test_unsupported_version_and_metadata_schema_mismatch_are_rejected(tmp_path, trained_backend):
    copy_artifact(trained_backend[0].artifact_directory, tmp_path)
    metadata_path = tmp_path / METADATA_FILE
    metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    metadata["model_version"] = "999.0.0"
    metadata_path.write_text(json.dumps(metadata), encoding="utf-8")
    with pytest.raises(ModelArtifactError, match="not supported"):
        load_artifact(tmp_path)

    copy_artifact(trained_backend[0].artifact_directory, tmp_path)
    schema_path = tmp_path / SCHEMA_FILE
    feature_schema = json.loads(schema_path.read_text(encoding="utf-8"))
    feature_schema["feature_names"] = feature_schema["feature_names"][:-1]
    schema_path.write_text(json.dumps(feature_schema), encoding="utf-8")
    with pytest.raises(FeatureSchemaError, match="feature schema"):
        load_artifact(tmp_path)


def test_corrupt_model_and_model_name_mismatch_are_rejected(tmp_path, trained_backend):
    copy_artifact(trained_backend[0].artifact_directory, tmp_path)
    (tmp_path / MODEL_FILE).write_bytes(b"not-a-joblib-model")
    with pytest.raises(ModelArtifactError, match="checksum mismatch"):
        load_artifact(tmp_path)

    copy_artifact(trained_backend[0].artifact_directory, tmp_path)
    metadata_path = tmp_path / METADATA_FILE
    metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    metadata["model_name"] = "ridge" if metadata["model_name"] != "ridge" else "extra_trees"
    metadata_path.write_text(json.dumps(metadata), encoding="utf-8")
    refresh_hash(tmp_path, METADATA_FILE)
    with pytest.raises(ModelArtifactError, match="does not match metadata"):
        load_artifact(tmp_path)


def test_checksum_fingerprint_and_mode_mismatch_are_rejected(tmp_path, trained_backend):
    source = trained_backend[0].artifact_directory
    copy_artifact(source, tmp_path)
    schema_path = tmp_path / SCHEMA_FILE
    schema_path.write_text(schema_path.read_text(encoding="utf-8") + " ", encoding="utf-8")
    with pytest.raises(ModelArtifactError, match="checksum mismatch"):
        load_artifact(tmp_path)

    copy_artifact(source, tmp_path)
    integrity_path = tmp_path / INTEGRITY_FILE
    integrity = json.loads(integrity_path.read_text(encoding="utf-8"))
    integrity["dataset_fingerprint"] = "wrong"
    integrity_path.write_text(json.dumps(integrity), encoding="utf-8")
    with pytest.raises(ModelArtifactError, match="fingerprint"):
        load_artifact(tmp_path)

    with pytest.raises(ModelArtifactError) as captured:
        load_artifact(source, expected_mode=ArtifactMode.REAL)
    assert captured.value.code == ErrorCode.ARTIFACT_MODE_MISMATCH
