"""Scientifically defensible utilities for machine RUL prediction."""

from .config import BackendConfig, DatasetSchema, TrainingConfig
from .exceptions import (
    ArtifactError,
    DataValidationError,
    FeatureSchemaError,
    InsufficientHistoryError,
    ModelArtifactError,
    ModelNotTrainedError,
    RULPredictorError,
    TrajectoryValidationError,
)
from .schemas import PredictionRequest, PredictionResult
from .schemas import (
    ArtifactMode,
    ArtifactState,
    BackendState,
    BackendStatus,
    DatasetState,
    ErrorCode,
    ErrorResult,
    EvaluationSummary,
    FRONTEND_CONTRACT_VERSION,
    MachineSummary,
    MetricsState,
    ModelMetadata,
    ModelState,
    ValidationReport,
)
from .service import RULService
from .version import __version__

__all__ = [
    "ArtifactError",
    "ArtifactMode",
    "ArtifactState",
    "BackendConfig",
    "BackendState",
    "BackendStatus",
    "DataValidationError",
    "DatasetSchema",
    "DatasetState",
    "ErrorCode",
    "ErrorResult",
    "EvaluationSummary",
    "FRONTEND_CONTRACT_VERSION",
    "FeatureSchemaError",
    "InsufficientHistoryError",
    "ModelArtifactError",
    "ModelMetadata",
    "ModelNotTrainedError",
    "ModelState",
    "MachineSummary",
    "MetricsState",
    "PredictionRequest",
    "PredictionResult",
    "RULService",
    "RULPredictorError",
    "TrainingConfig",
    "TrajectoryValidationError",
    "ValidationReport",
]
