"""Stateless FastAPI adapter around the public RULService contract."""

from __future__ import annotations

from io import BytesIO
import logging
from pathlib import Path
from time import perf_counter
from uuid import uuid4

import pandas as pd
from fastapi import FastAPI, File, Form, Request, UploadFile
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from ..config import BackendConfig
from ..exceptions import RULPredictorError
from ..schemas import ArtifactMode, ErrorCode, FRONTEND_CONTRACT_VERSION, PredictionRequest
from ..service import RULService
from .models import (
    ApiEnvelope,
    ApiError,
    DatasetInspectionData,
    DemoSampleData,
    EvaluationData,
    MachineInspectionData,
    MachineSeriesData,
    ModelMetadataData,
    PredictionData,
    StatusData,
)
from .settings import WebApiSettings

API_VERSION = "1.0"
API_PREFIX = "/api/v1"
PRODUCT_NAME = "LiveOps AI"
LOGGER = logging.getLogger("liveops.web_api")

ERROR_HTTP_STATUS = {
    ErrorCode.DATASET_NOT_FOUND: 404, ErrorCode.MACHINE_NOT_FOUND: 404,
    ErrorCode.MODE_NOT_ALLOWED: 409, ErrorCode.ARTIFACT_MODE_MISMATCH: 409,
    ErrorCode.UPLOAD_TOO_LARGE: 413, ErrorCode.UNSUPPORTED_MEDIA_TYPE: 415,
    ErrorCode.INVALID_SCHEMA: 422, ErrorCode.DUPLICATE_MACHINE_CYCLE: 422,
    ErrorCode.INSUFFICIENT_HISTORY: 422, ErrorCode.FEATURE_SCHEMA_MISMATCH: 422,
    ErrorCode.MODEL_NOT_TRAINED: 503, ErrorCode.ARTIFACT_UNAVAILABLE: 503,
    ErrorCode.ARTIFACT_CORRUPTED: 503, ErrorCode.UNSUPPORTED_MODEL_VERSION: 503,
}

DEMO_SAMPLES = {
    "healthy": ("Healthy sample", "demo_machine_healthy.csv", "HEALTHY"),
    "monitor": ("Monitor sample", "demo_machine_monitor.csv", "MONITOR"),
    "critical": ("Critical sample", "demo_machine_critical.csv", "CRITICAL"),
}


def _meta(request: Request) -> dict[str, str]:
    return {"api_version": API_VERSION, "request_id": request.state.request_id}


def _success(request: Request, data: object, status_code: int = 200) -> JSONResponse:
    return JSONResponse(status_code=status_code, content={"success": True, "data": data, "error": None, "meta": _meta(request)})


def _failure(request: Request, error: ApiError, status_code: int) -> JSONResponse:
    return JSONResponse(status_code=status_code, content={"success": False, "data": None, "error": error.model_dump(), "meta": _meta(request)})


def create_api_app(
    mode: ArtifactMode,
    settings: WebApiSettings | None = None,
    *,
    service: RULService | None = None,
) -> FastAPI:
    """Create an explicitly mode-scoped, request-stateless API."""

    settings = settings or WebApiSettings()
    service = service or RULService(BackendConfig(data_directory=settings.root / "data" / "raw", artifact_directory=settings.root / "artifacts" / mode.value, mode=mode))
    app = FastAPI(title=PRODUCT_NAME, version=API_VERSION, docs_url="/docs")
    app.state.mode, app.state.service, app.state.settings = mode, service, settings
    app.add_middleware(CORSMiddleware, allow_origins=list(settings.allowed_origins), allow_credentials=False, allow_methods=["GET", "POST", "OPTIONS"], allow_headers=["Content-Type", "X-Request-ID"])

    @app.middleware("http")
    async def request_context(request: Request, call_next):
        request.state.request_id = request.headers.get("X-Request-ID") or str(uuid4())
        started = perf_counter()
        response = await call_next(request)
        response.headers["X-Request-ID"] = request.state.request_id
        LOGGER.info("request_id=%s method=%s endpoint=%s status=%s duration_ms=%.2f mode=%s", request.state.request_id, request.method, request.url.path, response.status_code, (perf_counter() - started) * 1000, mode.value)
        return response

    @app.exception_handler(RULPredictorError)
    async def backend_error(request: Request, exc: RULPredictorError):
        result = exc.to_error_result()
        return _failure(request, ApiError(code=result.code.value, message=result.message, recoverable=result.recoverable, details=result.safe_details), ERROR_HTTP_STATUS.get(result.code, 422))

    @app.exception_handler(RequestValidationError)
    async def request_error(request: Request, exc: RequestValidationError):
        del exc
        return _failure(request, ApiError(code="INVALID_REQUEST", message="The HTTP request is invalid.", recoverable=True), 422)

    @app.exception_handler(Exception)
    async def unexpected_error(request: Request, exc: Exception):
        LOGGER.exception("Unexpected API failure request_id=%s", request.state.request_id)
        del exc
        return _failure(request, ApiError(code="INTERNAL_ERROR", message="An unexpected internal error occurred.", recoverable=False), 500)

    async def read_csv(file: UploadFile) -> pd.DataFrame:
        if file.content_type not in {"text/csv", "application/csv", "application/vnd.ms-excel"}:
            raise RULPredictorError("Only CSV uploads are supported.", code=ErrorCode.UNSUPPORTED_MEDIA_TYPE)
        content = await file.read(settings.max_upload_bytes + 1)
        if len(content) > settings.max_upload_bytes:
            raise RULPredictorError("The CSV upload exceeds the 4 MiB limit.", code=ErrorCode.UPLOAD_TOO_LARGE)
        if not content:
            raise RULPredictorError("The CSV upload is empty.", code=ErrorCode.INVALID_SCHEMA)
        try:
            return pd.read_csv(BytesIO(content))
        except (pd.errors.EmptyDataError, pd.errors.ParserError, UnicodeDecodeError) as exc:
            raise RULPredictorError("The CSV upload is malformed.", code=ErrorCode.INVALID_SCHEMA) from exc

    def select_machine(frame: pd.DataFrame, machine_id: str) -> tuple[pd.DataFrame, int | str]:
        ids = service.list_machine_ids(frame)
        matches = [value for value in ids if str(value) == machine_id]
        if not matches:
            raise RULPredictorError("The requested machine was not found.", code=ErrorCode.MACHINE_NOT_FOUND)
        selected = matches[0]
        column = service.config.schema.machine_id
        return frame[frame[column].astype(str) == str(selected)].copy(), selected

    @app.get("/")
    def root(request: Request):
        return _success(request, {"product_name": PRODUCT_NAME, "api_version": API_VERSION, "mode": mode.value, "documentation": "/docs", "status": f"{API_PREFIX}/status"})

    @app.get(f"{API_PREFIX}/health/live")
    def live(request: Request):
        return _success(request, {"status": "alive"})

    @app.get(f"{API_PREFIX}/health/ready")
    def ready(request: Request):
        status = service.get_status()
        return _success(request, {"status": "ready", "prediction_available": status.prediction_available, "model_state": status.model_state.value})

    @app.get(f"{API_PREFIX}/status", response_model=ApiEnvelope[StatusData])
    def status_endpoint(request: Request):
        status = service.get_status()
        data = {"product_name": PRODUCT_NAME, "api_version": API_VERSION, "backend_contract_version": FRONTEND_CONTRACT_VERSION, "run_mode": mode.value, **{key: value for key, value in status.to_dict().items() if key not in {"contract_version", "message"}}}
        return _success(request, data)

    @app.get(f"{API_PREFIX}/model/metadata", response_model=ApiEnvelope[ModelMetadataData])
    def metadata_endpoint(request: Request):
        metadata = service.get_model_metadata(); raw = metadata.raw
        return _success(request, {"model_name": metadata.model_name, "model_version": metadata.model_version, "training_data_kind": metadata.training_data_kind, "demo_only": metadata.demo_only, "feature_count": len(metadata.feature_names), "rul_unit": metadata.rul_unit, "maintenance_thresholds": raw.get("maintenance_thresholds"), "artifact_version": raw.get("model_version"), "dataset_fingerprint": raw.get("dataset_fingerprint"), "metrics_publishable": metadata.metrics_publishable})

    @app.get(f"{API_PREFIX}/model/evaluation", response_model=ApiEnvelope[EvaluationData])
    def evaluation_endpoint(request: Request):
        summary = service.get_evaluation_summary().to_dict(); summary["training_data_kind"] = "synthetic" if mode == ArtifactMode.DEMO else "real"
        return _success(request, summary)

    @app.get(f"{API_PREFIX}/demo/samples", response_model=ApiEnvelope[list[DemoSampleData]])
    def samples(request: Request):
        if mode != ArtifactMode.DEMO:
            raise RULPredictorError("Demo samples are unavailable in real mode.", code=ErrorCode.MODE_NOT_ALLOWED)
        values = []
        for sample_id, (name, filename, category) in DEMO_SAMPLES.items():
            frame = pd.read_csv(settings.root / "data" / "sample" / filename)
            values.append({"sample_id": sample_id, "display_name": name, "filename": filename, "category": category, "machine_count": int(frame[service.config.schema.machine_id].nunique()), "observation_count": len(frame), "warning": "Synthetic software demonstration only; no real accuracy claim."})
        return _success(request, values)

    @app.post(f"{API_PREFIX}/datasets/inspect", response_model=ApiEnvelope[DatasetInspectionData])
    async def inspect_dataset(request: Request, file: UploadFile = File(...)):
        frame = await read_csv(file); validation = service.validate_dataset(frame); ids = service.list_machine_ids(frame)
        return _success(request, {"filename": Path(file.filename or "upload.csv").name, "validation": validation.to_dict(), "machine_ids": list(ids), "row_count": len(frame), "column_count": len(frame.columns), "dataset_state": service.get_status().dataset_state.value, "warnings": list(validation.warnings)})

    @app.post(f"{API_PREFIX}/machines/inspect", response_model=ApiEnvelope[MachineInspectionData])
    async def machine_summary(request: Request, file: UploadFile = File(...), machine_id: str = Form(...)):
        frame = await read_csv(file); history, selected = select_machine(frame, machine_id)
        return _success(request, service.describe_machine(frame, selected).to_dict())

    @app.post(f"{API_PREFIX}/machines/series", response_model=ApiEnvelope[MachineSeriesData])
    async def machine_series(request: Request, file: UploadFile = File(...), machine_id: str = Form(...), sensors: str = Form(""), maximum_points: int = Form(1000)):
        frame = await read_csv(file); history, selected = select_machine(frame, machine_id)
        requested = [value.strip() for value in sensors.split(",") if value.strip()] or [service.config.schema.sensor_columns[0]]
        if any(name not in service.config.schema.sensor_columns for name in requested):
            raise RULPredictorError("One or more requested sensor names are invalid.", code=ErrorCode.INVALID_SCHEMA)
        if len(requested) > settings.max_sensors_per_series:
            raise RULPredictorError("Too many sensor series were requested.", code=ErrorCode.INVALID_SCHEMA)
        maximum = min(max(1, maximum_points), settings.max_series_points)
        if len(history) > maximum:
            positions = sorted({round(index * (len(history) - 1) / (maximum - 1)) for index in range(maximum)}) if maximum > 1 else [len(history) - 1]
            history = history.iloc[positions]
        cycle = service.config.schema.cycle
        return _success(request, {"machine_id": selected, "cycle": [int(value) for value in history[cycle]], "series": {name: [float(value) for value in history[name]] for name in requested}})

    @app.post(f"{API_PREFIX}/predictions", response_model=ApiEnvelope[PredictionData])
    async def prediction(request: Request, file: UploadFile = File(...), machine_id: str = Form(...)):
        frame = await read_csv(file); history, selected = select_machine(frame, machine_id)
        result = service.predict(PredictionRequest(selected, history)).to_dict(); result["demo_only"] = mode == ArtifactMode.DEMO
        return _success(request, result)

    return app
