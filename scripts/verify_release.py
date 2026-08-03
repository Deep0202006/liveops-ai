"""Definitive pre-frontend release verification."""

from __future__ import annotations

import json
from pathlib import Path
import subprocess
import sys

from fastapi.testclient import TestClient

from rul_predictor.api import WebApiSettings, create_api_app
from rul_predictor.artifacts import load_artifact
from rul_predictor.data_loading import load_cmapss_trajectory, load_official_rul
from rul_predictor.schemas import ArtifactMode

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


def run(command: list[str]) -> None:
    result = subprocess.run(command, cwd=ROOT, check=False)
    if result.returncode:
        raise RuntimeError(f"Command failed ({result.returncode}): {' '.join(command)}")


def main() -> int:
    checks: list[str] = []
    try:
        run([sys.executable, "-m", "pip", "check"]); checks.append("dependencies")
        run([sys.executable, "-m", "compileall", "-q", "src", "api", "scripts", "tests"]); checks.append("compilation")
        run([sys.executable, "-m", "pytest", "-q"]); checks.append("tests")
        train = load_cmapss_trajectory(ROOT / "data/raw/train_FD001.txt")
        test = load_cmapss_trajectory(ROOT / "data/raw/test_FD001.txt")
        truth = load_official_rul(ROOT / "data/raw/RUL_FD001.txt")
        assert train.machine_id.nunique() == test.machine_id.nunique() == len(truth) == 100; checks.append("official_fd001")
        _, real_metadata, _ = load_artifact(ROOT / "artifacts/real", expected_mode=ArtifactMode.REAL)
        load_artifact(ROOT / "artifacts/demo", expected_mode=ArtifactMode.DEMO)
        assert real_metadata["final_test_metrics"] and not real_metadata["demo_only"]; checks.append("artifacts")
        machine = int(test.machine_id.iloc[0]); payload = test[test.machine_id == machine].to_csv(index=False).encode()
        with TestClient(create_api_app(ArtifactMode.REAL, WebApiSettings(root=ROOT))) as client:
            response = client.post("/api/v1/predictions", files={"file": ("machine.csv", payload, "text/csv")}, data={"machine_id": str(machine)})
            assert response.status_code == 200 and not response.json()["data"]["demo_only"]
            assert client.post("/api/v1/datasets/inspect", files={"file": ("large.csv", b"x" * (4 * 1024 * 1024 + 1), "text/csv")}).status_code == 413
            schema = client.get("/openapi.json").json()
        exported = json.loads((ROOT / "docs/web-api/openapi-v1.json").read_text(encoding="utf-8"))
        assert exported == schema and not any("dataset_id" in path for path in schema["paths"]); checks.append("stateless_api_openapi")
        assert not list(ROOT.glob("*.bat")); checks.append("no_batch_dependency")
        assert not (ROOT / "src/rul_predictor/api/registry.py").exists(); checks.append("no_registry")
        import api.index  # noqa: F401
        assert "streamlit" not in (ROOT / "pyproject.toml").read_text(encoding="utf-8").split("[project.optional-dependencies]")[0]
        checks.append("vercel_entry_and_production_dependencies")
    except Exception as exc:
        print(f"RELEASE_VERIFICATION_FAILED: {exc}", file=sys.stderr); return 2
    print(json.dumps({"status": "VERIFIED", "checks": checks, "vercel_build": "EXTERNAL_AUTHENTICATION_REQUIRED"}, indent=2)); return 0


if __name__ == "__main__": raise SystemExit(main())
