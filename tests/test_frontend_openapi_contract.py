"""Contract gates required before the typed browser client can be generated."""

from pathlib import Path
import json

from fastapi.testclient import TestClient

from rul_predictor.api import WebApiSettings, create_api_app
from rul_predictor.api.models import (
    ApiEnvelope,
    DatasetInspectionData,
    DemoSampleData,
    EvaluationData,
    MachineInspectionData,
    MachineSeriesData,
    ModelMetadataData,
    PredictionData,
    StatusData,
)
from rul_predictor.demo import build_demo_artifact
from rul_predictor.schemas import ArtifactMode


ROOT = Path(__file__).resolve().parents[1]
OPENAPI = ROOT / "docs" / "web-api" / "openapi-v1.json"
SAMPLE = ROOT / "data" / "sample" / "demo_machine_monitor.csv"

FRONTEND_OPERATIONS = {
    ("get", "/api/v1/status"),
    ("get", "/api/v1/model/metadata"),
    ("get", "/api/v1/model/evaluation"),
    ("get", "/api/v1/demo/samples"),
    ("post", "/api/v1/datasets/inspect"),
    ("post", "/api/v1/machines/inspect"),
    ("post", "/api/v1/machines/series"),
    ("post", "/api/v1/predictions"),
}


def test_frontend_operations_publish_typed_success_responses():
    """Every frontend operation must generate a concrete TypeScript response type."""

    schema = json.loads(OPENAPI.read_text(encoding="utf-8"))
    untyped = []
    for method, path in sorted(FRONTEND_OPERATIONS):
        response_schema = schema["paths"][path][method]["responses"]["200"][
            "content"
        ]["application/json"]["schema"]
        if not response_schema:
            untyped.append(f"{method.upper()} {path}")

    assert not untyped, (
        "OpenAPI success responses are untyped and generate `unknown`: "
        + ", ".join(untyped)
    )


def _upload():
    return {"file": (SAMPLE.name, SAMPLE.read_bytes(), "text/csv")}


def _validate(model, response):
    assert response.status_code == 200, response.text
    return ApiEnvelope[model].model_validate(response.json()).data


def test_runtime_responses_match_declared_models_in_demo_and_real_modes():
    build_demo_artifact()
    settings = WebApiSettings(root=ROOT)
    with TestClient(create_api_app(ArtifactMode.DEMO, settings)) as client:
        status = _validate(StatusData, client.get("/api/v1/status"))
        assert status is not None and status.demo_only
        _validate(ModelMetadataData, client.get("/api/v1/model/metadata"))
        _validate(EvaluationData, client.get("/api/v1/model/evaluation"))
        samples = _validate(list[DemoSampleData], client.get("/api/v1/demo/samples"))
        assert samples
        inspection = _validate(
            DatasetInspectionData,
            client.post("/api/v1/datasets/inspect", files=_upload()),
        )
        assert inspection is not None
        machine_id = str(inspection.machine_ids[0])
        _validate(
            MachineInspectionData,
            client.post(
                "/api/v1/machines/inspect",
                files=_upload(),
                data={"machine_id": machine_id},
            ),
        )
        _validate(
            MachineSeriesData,
            client.post(
                "/api/v1/machines/series",
                files=_upload(),
                data={
                    "machine_id": machine_id,
                    "sensors": "sensor_1,sensor_2",
                    "maximum_points": "5",
                },
            ),
        )
        _validate(
            PredictionData,
            client.post(
                "/api/v1/predictions",
                files=_upload(),
                data={"machine_id": machine_id},
            ),
        )

    with TestClient(create_api_app(ArtifactMode.REAL, settings)) as client:
        status = _validate(StatusData, client.get("/api/v1/status"))
        assert status is not None and not status.demo_only
        metadata = _validate(ModelMetadataData, client.get("/api/v1/model/metadata"))
        evaluation = _validate(EvaluationData, client.get("/api/v1/model/evaluation"))
        assert metadata is not None and metadata.training_data_kind == "real"
        assert evaluation is not None and evaluation.final_test is not None


def test_every_frontend_operation_references_a_component_schema():
    schema = create_api_app(ArtifactMode.DEMO).openapi()
    for method, path in FRONTEND_OPERATIONS:
        response_schema = schema["paths"][path][method]["responses"]["200"][
            "content"
        ]["application/json"]["schema"]
        assert "$ref" in response_schema, f"{method.upper()} {path} is not component-typed"
