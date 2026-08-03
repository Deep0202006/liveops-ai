# ML Pipeline Audit

## Existing trace

1. `SensorSimulator.generate()` creates one random observation.
2. `RiskEngine.evaluate()` stores ten recent observations per machine in process memory.
3. It computes slopes, acceleration, variance, and fixed threshold increments.
4. It calculates a threshold-crossing extrapolation and may mutate the event RUL.
5. `AIReasoner.explain()` converts thresholds to prose/actions and calls risk score “confidence.”
6. FastAPI broadcasts the result; React stores/display recent values.

Steps for cleaning a fixed dataset, target generation from failure endpoints, feature selection, machine split, fitted preprocessing, learned model training, held-out evaluation, model saving/loading, and schema-checked inference do not exist.

## Model record

| Item | Result |
|---|---|
| Algorithm | Hand-authored additive rule score and threshold extrapolation |
| Hyperparameters | Magic thresholds/weights embedded in code |
| Random seed | None |
| Loss function | None |
| Training/validation/test machines | 0 / 0 / 0 |
| Input/output shape | One event plus up to 10 in-memory events → scores |
| Baseline comparison | None |
| Metrics | None |
| Model size/inference timing | Not applicable/not measured |

## Training/inference mismatch

There is no training pipeline. Simulator “RUL” and risk engine “ticks to failure” use separate formulas; the UI displays the mutated event value, while explanation also exposes the other forecast. In-memory history is lost on restart and differs between machine selection sessions.

## Findings

- **P0:** there is no machine-learning RUL model despite examiner-facing predictive/AI language.
- **P0:** no validation/final-test separation can be demonstrated.
- **P1:** current history features are not reproducible and have no persisted cycle identity.
- **P1:** risk score is presented as confidence without calibration.
- **P1:** decision history changes risk by ±0.15 independent of measured outcomes; this is not reinforcement learning.
- **P2:** business, UI, simulator, and analytics concerns are tightly coupled through global instances.

## Required repair

Implement a small shared Python package: schema validation, defensible cycle-based targets, group split, scikit-learn pipelines, Dummy/Ridge/tree comparison on validation machines, untouched test evaluation, artifact metadata/schema, and one inference path used by the UI and scripts.
