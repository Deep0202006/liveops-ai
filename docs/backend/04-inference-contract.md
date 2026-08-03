# Inference Contract

```python
service = RULService()
status = service.get_status()
result = service.predict(PredictionRequest(machine_id=17, trajectory=history))
```

`PredictionResult` contains machine ID, latest cycle, non-negative point prediction, cycles, maintenance status, optional validation-residual bounds, warnings, important model features, recent sensor changes, model name, and version.

Maintenance status is a transparent presentation rule:

- `URGENT_INSPECTION`: prediction ≤25 cycles;
- `PLAN_MAINTENANCE`: prediction ≤50 cycles;
- `MONITOR`: otherwise.

Bounds add saved validation-residual quantiles to the point prediction and clip at zero. They are estimated ranges, not confidence probabilities or guarantees. Importance describes model reliance, not physical causation. The service loads the configured trusted artifact once per instance and reuses it across calls.

Expected no-model states are `REAL_DATASET_REQUIRED`, `MODEL_NOT_TRAINED`, `ARTIFACT_INVALID`, and `FINAL_METRICS_UNAVAILABLE`. Expected failures never require a frontend to parse a traceback.
