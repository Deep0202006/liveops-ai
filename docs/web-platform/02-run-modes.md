# Website Run Modes

`demo` loads only `artifacts/demo`, enables deterministic sample endpoints, labels all model evidence synthetic/non-publishable, and never writes real artifacts. `real` loads only `artifacts/real`, blocks demo endpoints, but starts health/status/upload endpoints even while `MODEL_NOT_TRAINED`; only prediction-dependent operations return 503.

There is no automatic mode or synthetic fallback. Mode is fixed per API process by the launcher.
