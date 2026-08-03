# Model Evaluation Audit

## Verdict

**BLOCKED:** no evaluation dataset, trained model, predictions against observed labels, or metric implementation exists. Therefore, no current accuracy figure is trustworthy or even reproducible.

## Current examiner-facing numbers

- `risk_score`: sum of fixed weights, capped at 1.0; not probability or model confidence.
- action “success” defaults: 75%, 85%, 90%, 99%, then increase based on logged high-risk decisions without outcomes.
- `financial_savings`: sum of risk scores for non-ignore decisions multiplied by 42,000.
- `failure_cost`: fixed formulas from risk score.
- RUL: threshold-derived and noisy.

These values must not be presented as learned accuracy, empirical confidence, prevented cost, or validated RUL performance.

## Missing evaluation controls

- MAE, RMSE, median absolute error, and R² with cycle units.
- error by machine and RUL band/near-failure subset.
- DummyRegressor and Ridge baselines.
- validation metrics for model selection.
- final untouched test metrics and evaluated-machine count.
- residual and actual-versus-predicted evidence.
- training duration, inference duration, and artifact size.

## Evaluation repair

Use training machines for fitting, validation machines for selecting among a small set of lightweight models, and official held-out test trajectories/labels only once for final reporting. Persist exact split IDs and metrics. Predictions may be clipped non-negative for operational presentation, but report and document that post-processing. A residual-quantile interval may be shown only if derived from validation residuals and explicitly described; otherwise show no confidence range.
