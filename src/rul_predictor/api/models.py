"""JSON-only HTTP request and response models."""

from enum import StrEnum
from typing import Any, Generic, TypeVar

from pydantic import BaseModel, ConfigDict, Field

from ..schemas import (
    ArtifactMode,
    ArtifactState,
    BackendState,
    DatasetState,
    MetricsState,
    ModelState,
)

T = TypeVar("T")


class ApiError(BaseModel):
    code: str
    message: str
    recoverable: bool
    details: dict[str, Any] = Field(default_factory=dict)


class ApiMeta(BaseModel):
    api_version: str
    request_id: str


class ApiEnvelope(BaseModel, Generic[T]):
    model_config = ConfigDict(extra="forbid")
    success: bool
    data: T | None = None
    error: ApiError | None = None
    meta: ApiMeta


class StatusData(BaseModel):
    product_name: str
    api_version: str
    backend_contract_version: str
    run_mode: ArtifactMode
    backend_state: BackendState
    dataset_state: DatasetState
    model_state: ModelState
    artifact_state: ArtifactState
    metrics_state: MetricsState
    prediction_available: bool
    demo_only: bool


class TrainingDataKind(StrEnum):
    REAL = "real"
    SYNTHETIC = "synthetic"


class MaintenanceStatus(StrEnum):
    CRITICAL = "CRITICAL"
    PLAN_MAINTENANCE = "PLAN_MAINTENANCE"
    MONITOR = "MONITOR"
    HEALTHY = "HEALTHY"


class DemoSampleCategory(StrEnum):
    HEALTHY = "HEALTHY"
    MONITOR = "MONITOR"
    CRITICAL = "CRITICAL"


class PredictionData(BaseModel):
    machine_id: int | str
    observed_through_cycle: int
    predicted_rul: float
    rul_unit: str
    maintenance_status: MaintenanceStatus
    lower_bound: float | None
    upper_bound: float | None
    warnings: list[str]
    important_features: list[str]
    recent_changes: list[str]
    model_name: str
    model_version: str
    demo_only: bool


class MaintenanceThresholds(BaseModel):
    model_config = ConfigDict(extra="forbid")
    urgent_at_or_below: float
    plan_at_or_below: float
    monitor_at_or_below: float


class ModelMetadataData(BaseModel):
    model_config = ConfigDict(extra="forbid")
    model_name: str
    model_version: str
    training_data_kind: TrainingDataKind
    demo_only: bool
    feature_count: int = Field(ge=0)
    rul_unit: str
    maintenance_thresholds: MaintenanceThresholds | None
    artifact_version: str | None
    dataset_fingerprint: str | None
    metrics_publishable: bool


class EvaluationMetricData(BaseModel):
    model_config = ConfigDict(extra="forbid")
    model_name: str
    mae: float
    rmse: float
    median_absolute_error: float
    r2: float
    machine_count: int = Field(ge=0)
    observation_count: int = Field(ge=0)
    near_failure_mae: float | None
    machine_mae_std: float | None
    error_by_rul_band: dict[str, float]
    runtime_seconds: float | None
    artifact_size_bytes: int | None


class EvaluationData(BaseModel):
    model_config = ConfigDict(extra="forbid")
    metrics_state: MetricsState
    final_test: EvaluationMetricData | None
    validation_models: list[EvaluationMetricData]
    message: str
    training_data_kind: TrainingDataKind


class DemoSampleData(BaseModel):
    model_config = ConfigDict(extra="forbid")
    sample_id: str
    display_name: str
    filename: str
    category: DemoSampleCategory
    machine_count: int = Field(ge=0)
    observation_count: int = Field(ge=0)
    warning: str


class ValidationData(BaseModel):
    model_config = ConfigDict(extra="forbid")
    valid: bool
    machine_count: int = Field(ge=0)
    observation_count: int = Field(ge=0)
    warnings: list[str]
    constant_sensor_columns: list[str]
    missing_cycles_by_machine: dict[str, list[int]]


class DatasetInspectionData(BaseModel):
    model_config = ConfigDict(extra="forbid")
    filename: str
    validation: ValidationData
    machine_ids: list[int | str]
    row_count: int = Field(ge=0)
    column_count: int = Field(ge=0)
    dataset_state: DatasetState
    warnings: list[str]


class MachineInspectionData(BaseModel):
    model_config = ConfigDict(extra="forbid")
    machine_id: int | str
    observation_count: int = Field(ge=0)
    first_cycle: int
    latest_cycle: int
    latest_sensor_values: dict[str, float]
    warnings: list[str]
    available_sensor_columns: list[str]
    recent_changes: list[str]
    prediction_ready: bool


class MachineSeriesData(BaseModel):
    model_config = ConfigDict(extra="forbid")
    machine_id: int | str
    cycle: list[int]
    series: dict[str, list[float]]
