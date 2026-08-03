"""Stable coded exceptions for expected backend failures."""

from typing import Any

from .schemas import ErrorCode, ErrorResult


class RULPredictorError(Exception):
    """Base error convertible to a frontend-safe structured result."""

    default_code = ErrorCode.PREDICTION_FAILED
    default_recoverable = True

    def __init__(
        self,
        message: str,
        *,
        code: ErrorCode | None = None,
        recoverable: bool | None = None,
        safe_details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.code = code or self.default_code
        self.recoverable = self.default_recoverable if recoverable is None else recoverable
        self.safe_details = safe_details or {}

    def to_error_result(self) -> ErrorResult:
        return ErrorResult(self.code, str(self), self.recoverable, dict(self.safe_details))


class DataValidationError(RULPredictorError):
    """Raised when sensor data violate the trained schema."""

    default_code = ErrorCode.INVALID_SCHEMA


class TrajectoryValidationError(DataValidationError):
    """Raised when machine-cycle trajectory semantics are invalid."""


class InsufficientHistoryError(TrajectoryValidationError):
    """Raised when a trajectory is too short for configured inference."""

    default_code = ErrorCode.INSUFFICIENT_HISTORY


class ModelArtifactError(RULPredictorError):
    """Raised when a trusted local artifact is corrupt or incompatible."""

    default_code = ErrorCode.ARTIFACT_CORRUPTED
    default_recoverable = False


class ModelNotTrainedError(ModelArtifactError):
    """Raised when no complete trusted local model artifact exists."""

    default_code = ErrorCode.MODEL_NOT_TRAINED
    default_recoverable = True


class FeatureSchemaError(DataValidationError, ModelArtifactError):
    """Raised when generated feature order differs from the artifact contract."""

    default_code = ErrorCode.FEATURE_SCHEMA_MISMATCH


# Backwards-compatible name retained for existing callers.
ArtifactError = ModelArtifactError
