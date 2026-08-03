import subprocess
import sys


def run_script(*arguments):
    return subprocess.run(
        [sys.executable, *arguments],
        cwd=".",
        capture_output=True,
        text=True,
        check=False,
        timeout=90,
    )


def test_missing_data_and_model_commands_fail_cleanly(tmp_path):
    missing = tmp_path / "missing.txt"
    validate = run_script(
        "scripts/validate_data.py", "--train", str(missing), "--test", str(missing), "--rul", str(missing)
    )
    assert validate.returncode == 2
    assert "REAL_DATASET_REQUIRED" in validate.stderr
    assert "Traceback" not in validate.stderr

    evaluate = run_script(
        "scripts/evaluate_model.py", "--artifacts", str(tmp_path)
    )
    assert evaluate.returncode == 2
    assert "EVALUATION_FAILED" in evaluate.stderr
    assert "Traceback" not in evaluate.stderr


def test_training_and_evaluation_cli_complete_on_synthetic_software_fixture(
    tmp_path, trajectories, schema
):
    train_path = tmp_path / "train_FD001.txt"
    test_path = tmp_path / "test_FD001.txt"
    truth_path = tmp_path / "RUL_FD001.txt"
    artifacts = tmp_path / "artifacts"
    trajectories.to_csv(train_path, sep=" ", header=False, index=False)
    trajectories.to_csv(test_path, sep=" ", header=False, index=False)
    truth_path.write_text("\n".join("0" for _ in trajectories[schema.machine_id].unique()), encoding="utf-8")

    train = run_script(
        "scripts/train_model.py",
        "--train", str(train_path),
        "--test", str(test_path),
        "--rul", str(truth_path),
        "--artifacts", str(artifacts),
    )
    assert train.returncode == 0, train.stderr
    assert "TRAINING_COMPLETE" in train.stdout
    assert (artifacts / "evaluation.json").is_file()

    evaluate = run_script(
        "scripts/evaluate_model.py",
        "--test", str(test_path),
        "--rul", str(truth_path),
        "--artifacts", str(artifacts),
    )
    assert evaluate.returncode == 0, evaluate.stderr
    assert '"rul_unit"' not in evaluate.stdout
    assert '"mae"' in evaluate.stdout
