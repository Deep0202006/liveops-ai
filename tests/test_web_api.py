from concurrent.futures import ThreadPoolExecutor
import json
from pathlib import Path

import pandas as pd
from fastapi.testclient import TestClient
import pytest

from rul_predictor.api import API_VERSION, WebApiSettings, create_api_app
from rul_predictor.demo import build_demo_artifact
from rul_predictor.schemas import ArtifactMode

ROOT = Path(__file__).resolve().parents[1]
SAMPLE = ROOT / "data/sample/demo_machine_monitor.csv"


@pytest.fixture(scope="module", autouse=True)
def demo_artifact(): build_demo_artifact()


@pytest.fixture()
def client():
    with TestClient(create_api_app(ArtifactMode.DEMO, WebApiSettings(root=ROOT))) as value: yield value


def envelope(response, success=True):
    payload = response.json(); assert payload["success"] is success
    assert payload["meta"]["api_version"] == API_VERSION and payload["meta"]["request_id"]
    assert (payload["error"] is None) is success
    return payload


def upload(path=SAMPLE): return {"file": (path.name, path.read_bytes(), "text/csv")}


def test_health_status_root_cors_and_missing_real_model(client, tmp_path):
    assert client.get("/").status_code == client.get("/api/v1/health/live").status_code == 200
    status = envelope(client.get("/api/v1/status"))["data"]
    assert status["api_version"] == status["backend_contract_version"] == "1.0"
    assert status["demo_only"] and status["prediction_available"]
    approved = client.options("/api/v1/status", headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": "GET"})
    assert approved.headers["access-control-allow-origin"] == "http://localhost:5173"
    rejected = client.options("/api/v1/status", headers={"Origin": "https://evil.example", "Access-Control-Request-Method": "GET"})
    assert "access-control-allow-origin" not in rejected.headers
    with TestClient(create_api_app(ArtifactMode.REAL, WebApiSettings(root=tmp_path))) as real:
        assert real.get("/api/v1/health/ready").status_code == 200
        assert not envelope(real.get("/api/v1/status"))["data"]["prediction_available"]
        machine = pd.read_csv(SAMPLE)["machine_id"].iloc[0]
        blocked = real.post("/api/v1/predictions", files=upload(), data={"machine_id": str(machine)})
        assert blocked.status_code == 503 and envelope(blocked, False)["error"]["code"] == "MODEL_NOT_TRAINED"
        assert real.get("/api/v1/demo/samples").status_code == 409


def test_stateless_inspection_summary_series_and_prediction(client):
    samples = envelope(client.get("/api/v1/demo/samples"))["data"]
    assert {item["sample_id"] for item in samples} == {"healthy", "monitor", "critical"}
    inspected = envelope(client.post("/api/v1/datasets/inspect", files=upload()))["data"]
    machine = inspected["machine_ids"][0]
    summary = envelope(client.post("/api/v1/machines/inspect", files=upload(), data={"machine_id": str(machine)}))["data"]
    assert summary["prediction_ready"] and summary["recent_changes"]
    series = envelope(client.post("/api/v1/machines/series", files=upload(), data={"machine_id": str(machine), "sensors": "sensor_1", "maximum_points": "5"}))["data"]
    assert len(series["cycle"]) <= 5 and series["cycle"] == sorted(series["cycle"])
    first = envelope(client.post("/api/v1/predictions", files=upload(), data={"machine_id": str(machine)}))["data"]
    second = envelope(client.post("/api/v1/predictions", files=upload(), data={"machine_id": str(machine)}))["data"]
    assert first == second and first["demo_only"] and first["rul_unit"] == "cycles"
    assert first["lower_bound"] <= first["predicted_rul"] <= first["upper_bound"]
    assert len(first["important_features"]) <= 5


def test_upload_limits_validation_and_unknowns(client):
    wrong = client.post("/api/v1/datasets/inspect", files={"file": ("model.joblib", b"x", "application/octet-stream")})
    assert wrong.status_code == 415
    assert client.post("/api/v1/datasets/inspect", files={"file": ("empty.csv", b"", "text/csv")}).status_code == 422
    frame = pd.read_csv(SAMPLE)
    missing = frame.drop(columns=["sensor_1"]).to_csv(index=False).encode()
    assert client.post("/api/v1/datasets/inspect", files={"file": ("bad.csv", missing, "text/csv")}).status_code == 422
    duplicate = pd.concat([frame, frame.iloc[[0]]]).to_csv(index=False).encode()
    response = client.post("/api/v1/datasets/inspect", files={"file": ("dup.csv", duplicate, "text/csv")})
    assert envelope(response, False)["error"]["code"] == "DUPLICATE_MACHINE_CYCLE"
    with TestClient(create_api_app(ArtifactMode.DEMO, WebApiSettings(root=ROOT, max_upload_bytes=10))) as tiny:
        assert tiny.post("/api/v1/datasets/inspect", files=upload()).status_code == 413
    assert client.post("/api/v1/machines/inspect", files=upload(), data={"machine_id": "999999"}).status_code == 404
    machine = pd.read_csv(SAMPLE)["machine_id"].iloc[0]
    assert client.post("/api/v1/machines/series", files=upload(), data={"machine_id": str(machine), "sensors": "private"}).status_code == 422


def test_concurrent_requests_are_independent(client):
    def predict(_: int):
        machine = pd.read_csv(SAMPLE)["machine_id"].iloc[0]
        return client.post("/api/v1/predictions", files=upload(), data={"machine_id": str(machine)}).json()["data"]["predicted_rul"]
    with ThreadPoolExecutor(max_workers=5) as pool:
        health = list(pool.map(lambda _: client.get("/api/v1/status").status_code, range(5)))
        values = list(pool.map(predict, range(5)))
    assert health == [200] * 5 and len(set(values)) == 1


def test_metadata_evaluation_and_final_stateless_openapi(client):
    assert envelope(client.get("/api/v1/model/metadata"))["data"]["demo_only"]
    schema = client.get("/openapi.json").json()
    required = {"/api/v1/status", "/api/v1/datasets/inspect", "/api/v1/machines/inspect", "/api/v1/machines/series", "/api/v1/predictions"}
    assert required <= set(schema["paths"])
    assert not any("{dataset_id}" in path or path == "/api/v1/datasets" for path in schema["paths"])
    assert schema["info"]["version"] == "1.0"
    rendered = str(schema); assert all(word not in rendered for word in ("DataFrame", "sklearn", "numpy"))
    exported = json.loads((ROOT / "docs/web-api/openapi-v1.json").read_text(encoding="utf-8"))
    assert exported == schema
