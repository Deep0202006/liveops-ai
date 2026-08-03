"""Typed public contracts exposed to future frontends and local scripts."""

from dataclasses import dataclass, field
from enum import StrEnum
from typing import Any

import pandas as pd

from .serialization import SerializableContract


FRONTEND_CONTRACT_VERSION = "1.0"


class ArtifactMode(StrEnum):
    REAL = "real"
    DEMO = "demo"


class BackendState(StrEnum):
    SOFTWARE_READY = "SOFTWARE_READY"


class DatasetState(StrEnum):
    REAL_DATASET_REQUIRED = "REAL_DATASET_REQUIRED"
    SYNTHETIC_DEMO_DATA = "SYNTHETIC_DEMO_DATA"
    REAL_DATASET_VALIDATED = "REAL_DATASET_VALIDATED"


class ModelState(StrEnum):
    MODEL_NOT_TRAINED = "MODEL_NOT_TRAINED"
    DEMO_MODEL_TRAINED = "DEMO_MODEL_TRAINED"
    REAL_MODEL_TRAINED = "REAL_MODEL_TRAINED"


class ArtifactState(StrEnum):
    ARTIFACT_UNAVAILABLE = "ARTIFACT_UNAVAILABLE"
    DEMO_ARTIFACT_AVAILABLE = "DEMO_ARTIFACT_AVAILABLE"
    REAL_ARTIFACT_AVAILABLE = "REAL_ARTIFACT_AVAILABLE"
    ARTIFACT_INVALID = "ARTIFACT_INVALID"


class MetricsState(StrEnum):
    FINAL_METRICS_UNAVAILABLE = "FINAL_METRICS_UNAVAILABLE"
    DEMO_METRICS_NOT_PUBLISHABLE = "DEMO_METRICS_NOT_PUBLISHABLE"
    FINAL_METRICS_AVAILABLE = "FINAL_METRICS_AVAILABLE"


@dataclass(frozen=True)
class PredictionRequest:
    machine_id: int | str
    trajectory: pd.DataFrame


@dataclass(frozen=True)
class PredictionResult(SerializableContract):
    machine_id: int | str
    observed_through_cycle: int
    predicted_rul: float
    rul_unit: str
    maintenance_status: str
    lower_bound: float | None
    upper_bound: float | None
    warnings: tuple[str, ...]
    important_features: tuple[str, ...]
    recent_changes: tuple[str, ...]
    model_name: str
    model_version: str


@dataclass(frozen=True)
class EvaluationResult(SerializableContract):
    model_name: str
    mae: float
    rmse: float
    median_absolute_error: float
    r2: float
    machine_count: int
    observation_count: int
    near_failure_mae: float | None
    machine_mae_std: float | None
    error_by_rul_band: dict[str, float] = field(default_factory=dict)
    runtime_seconds: float | None = None
    artifact_size_bytes: int | None = None


@dataclass(frozen=True)
class ValidationReport(SerializableContract):
    valid: bool
    machine_count: int
    observation_count: int
    warnings: tuple[str, ...] = ()
    constant_sensor_columns: tuple[str, ...] = ()
    missing_cycles_by_machine: dict[int, tuple[int, ...]] = field(default_factory=dict)


@dataclass(frozen=True)
class BackendStatus(SerializableContract):
    contract_version: str
    backend_state: BackendState
    dataset_state: DatasetState
    model_state: ModelState
    artifact_state: ArtifactState
    metrics_state: MetricsState
    prediction_available: bool
    demo_only: bool
    message: str


@dataclass(frozen=True)
class ModelMetadata(SerializableContract):
    model_name: str
    model_version: str
    dataset_name: str
    dataset_subset: str
    rul_unit: str
    feature_names: tuple[str, ...]
    removed_features: tuple[str, ...]
    training_data_kind: str
    demo_only: bool
    metrics_publishable: bool
    raw: dict[str, Any] = field(repr=False)


@dataclass(frozen=True)
class EvaluationSummary(SerializableContract):
    metrics_state: MetricsState
    final_test: EvaluationResult | None
    validation_models: tuple[EvaluationResult, ...]
    message: str


@dataclass(frozen=True)
class MachineSummary(SerializableContract):
    machine_id: int | str
    observation_count: int
    first_cycle: int
    latest_cycle: int
    latest_sensor_values: dict[str, float]
    warnings: tuple[str, ...] = ()
    available_sensor_columns: tuple[str, ...] = ()
    recent_changes: tuple[str, ...] = ()
    prediction_ready: bool = False


class ErrorCode(StrEnum):
    DATASET_NOT_FOUND = "DATASET_NOT_FOUND"
    MACHINE_NOT_FOUND = "MACHINE_NOT_FOUND"
    MODE_NOT_ALLOWED = "MODE_NOT_ALLOWED"
    UPLOAD_TOO_LARGE = "UPLOAD_TOO_LARGE"
    UNSUPPORTED_MEDIA_TYPE = "UNSUPPORTED_MEDIA_TYPE"
    REGISTRY_FULL = "REGISTRY_FULL"
    DATASET_MISSING = "DATASET_MISSING"
    MODEL_NOT_TRAINED = "MODEL_NOT_TRAINED"
    INVALID_SCHEMA = "INVALID_SCHEMA"
    DUPLICATE_MACHINE_CYCLE = "DUPLICATE_MACHINE_CYCLE"
    INSUFFICIENT_HISTORY = "INSUFFICIENT_HISTORY"
    FEATURE_SCHEMA_MISMATCH = "FEATURE_SCHEMA_MISMATCH"
    ARTIFACT_CORRUPTED = "ARTIFACT_CORRUPTED"
    ARTIFACT_UNAVAILABLE = "ARTIFACT_UNAVAILABLE"
    ARTIFACT_MODE_MISMATCH = "ARTIFACT_MODE_MISMATCH"
    UNSUPPORTED_MODEL_VERSION = "UNSUPPORTED_MODEL_VERSION"
    PREDICTION_FAILED = "PREDICTION_FAILED"


@dataclass(frozen=True)
class ErrorResult(SerializableContract):
    code: ErrorCode
    message: str
    recoverable: bool
    safe_details: dict[str, Any] = field(default_factory=dict)
