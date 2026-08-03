# Status Model

`BackendStatus` serializes independent state axes. Default/no-data mode returns `SOFTWARE_READY`, `REAL_DATASET_REQUIRED`, `MODEL_NOT_TRAINED`, `ARTIFACT_UNAVAILABLE`, `FINAL_METRICS_UNAVAILABLE`, and `prediction_available=false`.

Explicit demo mode returns `SYNTHETIC_DEMO_DATA`, `DEMO_MODEL_TRAINED`, `DEMO_ARTIFACT_AVAILABLE`, `DEMO_METRICS_NOT_PUBLISHABLE`, `prediction_available=true`, and `demo_only=true`.

Website clients obtain these axes from `GET /api/v1/status`, together with API version, backend contract version, and explicit run mode.

Only validated real mode may return `REAL_DATASET_VALIDATED`, `REAL_MODEL_TRAINED`, `REAL_ARTIFACT_AVAILABLE`, and—after official evaluation—`FINAL_METRICS_AVAILABLE`.
