# UI and User Workflow Audit

## Current journey

The Vite React app opens a marketing/command-center experience, connects to `ws://localhost:8000/ws`, receives rotating simulated machines, displays risk/RUL, permits anomaly injection and operator actions, and queries decision/analytics endpoints. It does not accept a historical CSV, select a labeled trajectory for inference, load a trained artifact, or show verified model evaluation.

## Findings

- **P0 functional honesty:** RUL, confidence, action success, savings, and costs are not tied to a trained/evaluated model.
- **P1:** RUL UI appends hours although backend specification uses ticks.
- **P1:** landing claims “encrypted, hashed” SQL ledgers and autonomous predictive agents without corresponding implementation.
- **P1:** mock default machine objects/results can appear before live validated input.
- **P1:** no schema validation, data-quality warnings, machine-history upload, genuine actual-vs-predicted chart, baseline table, or limitations panel.
- **P2:** huge single component and dense neon/dark command-center layout weaken examiner explanation.
- **P2:** `npm run lint` reports 14 errors and one hook warning.
- **P2:** main production JS is 619.08 kB and triggers a Vite chunk-size warning.
- **Low:** visual consistency is strong for a monitoring demo, charts and responsive utility classes exist, and connection/toast states are implemented.

## Recommendation

After ML validity, provide one restrained local examiner interface with Overview, Machine Prediction, Degradation Analysis, and Model Evaluation. Use real metadata/metrics only; disable evaluation views when no validated artifact exists; show cycles; validate official-format input; and keep the legacy simulator clearly separate or remove it from the examiner path.
