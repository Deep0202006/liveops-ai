# Data Leakage Audit

## Verdict

No trained pipeline exists, so a conventional overlap calculation is **BLOCKED**. This absence is not evidence of leakage prevention. The project cannot currently prove any separation.

## Leakage inventory

| Leakage mechanism | Current status | Risk |
|---|---|---|
| Random row split | No split exists | P0 absence |
| Same machine in train/test | No split exists | P0 absence |
| Scaling/imputation before split | No preprocessing | Not applicable yet |
| Target in features | Simulator RUL directly derives from current sensors | High circularity |
| Final lifetime input | No dataset | Unknown |
| Future rolling data | In-memory history is causal, but event mutation and order are implicit | Medium |
| Centered windows | Not used | Low |
| Test tuning | No test set | P0 absence |
| Machine ID as numeric predictor | No model | Must be prevented |

## Evidence and root causes

`SensorSimulator` calculates RUL from temperature, vibration, load, and lubrication, and `RiskEngine` then derives another forecast from the same data. This guarantees a visually convincing relationship by construction but cannot demonstrate generalization. Root cause: the application began as a live simulator/dashboard and predictive claims were layered onto deterministic rules without a supervised experimental design.

## Mandatory implementation assertions

The repaired pipeline must split unique machine IDs before fitting any transform and assert:

```python
assert set(train_machine_ids).isdisjoint(validation_machine_ids)
assert set(train_machine_ids).isdisjoint(test_machine_ids)
assert set(validation_machine_ids).isdisjoint(test_machine_ids)
```

All imputers/scalers/selectors must be inside a scikit-learn pipeline fitted on training machines only. Rolling features must sort by machine/cycle, group by machine, use trailing windows only, and be identical at inference.
