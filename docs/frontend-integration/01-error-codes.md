# Frontend Error Codes

Expected `RULPredictorError` instances convert through `to_error_result()` to `code`, `message`, `recoverable`, and safe `details`. Supported stable codes include `DATASET_MISSING`, `MODEL_NOT_TRAINED`, `INVALID_SCHEMA`, `DUPLICATE_MACHINE_CYCLE`, `INSUFFICIENT_HISTORY`, `FEATURE_SCHEMA_MISMATCH`, `ARTIFACT_CORRUPTED`, `ARTIFACT_UNAVAILABLE`, `ARTIFACT_MODE_MISMATCH`, `UNSUPPORTED_MODEL_VERSION`, and `PREDICTION_FAILED`.

Display the safe message. Do not show tracebacks or infer state from message text; use the code and `BackendStatus` axes.

HTTP clients receive these values in the uniform API envelope. Web codes also include `DATASET_NOT_FOUND`, `MACHINE_NOT_FOUND`, `MODE_NOT_ALLOWED`, `UPLOAD_TOO_LARGE`, `UNSUPPORTED_MEDIA_TYPE`, and `REGISTRY_FULL`.
