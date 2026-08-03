import importlib
from pathlib import Path

import pytest

from rul_predictor.artifacts import load_artifact
from rul_predictor.data_loading import load_cmapss_trajectory, load_official_rul
from rul_predictor.schemas import ArtifactMode

ROOT = Path(__file__).resolve().parents[1]


def test_vercel_entry_imports_without_streamlit_or_raw_data(monkeypatch):
    monkeypatch.setenv("LIVEOPS_MODE", "real")
    module = importlib.reload(importlib.import_module("api.index"))
    assert module.app.version == "1.0"
    source = (ROOT / "api/index.py").read_text(encoding="utf-8")
    assert "train_model" not in source and "download" not in source and "streamlit" not in source


def test_vercel_entry_adds_src_before_importing_application_package():
    source = (ROOT / "api/index.py").read_text(encoding="utf-8")
    path_setup = source.index("sys.path.insert")
    package_import = source.index("from rul_predictor.api")
    assert path_setup < package_import


def test_real_artifact_is_integral_and_compact():
    pipeline, metadata, features = load_artifact(ROOT / "artifacts/real", expected_mode=ArtifactMode.REAL)
    assert pipeline is not None and features
    assert metadata["dataset_subset"] == "FD001" and not metadata["demo_only"]
    assert metadata["final_test_metrics"]["machine_count"] == 100
    assert (ROOT / "artifacts/real/model.joblib").stat().st_size < 50 * 1024 * 1024


@pytest.mark.skipif(not (ROOT / "data/raw/train_FD001.txt").is_file(), reason="authorized raw FD001 is not required at runtime")
def test_official_fd001_shapes_and_truth_alignment():
    train = load_cmapss_trajectory(ROOT / "data/raw/train_FD001.txt")
    test = load_cmapss_trajectory(ROOT / "data/raw/test_FD001.txt")
    truth = load_official_rul(ROOT / "data/raw/RUL_FD001.txt")
    assert train.machine_id.nunique() == test.machine_id.nunique() == len(truth) == 100
    assert len(train) == 20631 and len(test) == 13096
