# Consolidated Audit Report

## Executive summary

The current software is a polished-looking FastAPI/React live sensor simulator with hand-authored risk rules, operator interventions, a SQLite decision ledger, and WebSocket charts. Python imports and the frontend production build work. It is not currently a historical sensor-data RUL prediction project: there is no dataset, defensible RUL label, trained model, split, held-out evaluation, artifact, or test suite.

The methodology and metrics are therefore not trustworthy for an RUL examiner demonstration. The central risk is functional/scientific honesty: noisy threshold transformations are labeled RUL, a rule score is labeled confidence, and fixed formulas are shown as savings/success. The current interface is visually elaborate but not examiner-ready because it cannot demonstrate data provenance, leakage prevention, baseline improvement, or genuine held-out metrics.

## Real strengths

- Local application already starts from simple Python and npm commands.
- The frontend production build passes and has coherent visual styling/charts.
- Sensor events use Pydantic models.
- SQLite statements are parameterized.
- The in-memory trend calculations use only accumulated past events (though ordering is implicit).
- No cloud/deployment infrastructure or deep-learning dependency is present.

## Risk-ranked weaknesses and evidence

### P0 — invalidates or blocks the project

1. **No valid RUL dataset/target.** Evidence: no data files/loaders; `simulator.py:generate` constructs `rul` from current thresholds plus random noise.
2. **No trained ML pipeline or experimental split.** Evidence: requirements omit scikit-learn/pandas; repository has no training/evaluation script or artifact.
3. **No trustworthy metrics.** Evidence: no metric code; UI/business values come from fixed multipliers and rule weights.

### P1 — damages examiner credibility

1. **Unit mismatch:** `PRD.md` says ticks; `App.jsx` appends `h`.
2. **Misleading claims:** “confidence,” “success,” “financial savings,” “encrypted/hashed,” “AI agents,” and “reinforcement” lack empirical/implementation support.
3. **No data validation or schema contract.** Invalid history cannot be rejected because upload/inference does not exist.
4. **No reproducible environment/tests.** pytest absent; lint has 14 errors; dependencies unpinned.
5. **Training/inference consistency and leakage prevention cannot be proven.** No shared fitted pipeline or machine split.

### P2 — quality and maintainability

- One oversized React component mixes unrelated workflows.
- Global mutable simulator/model state, working-directory DB paths, broad exception handling, print logging, and magic values.
- Open wildcard CORS and untyped request bodies.
- Documentation describes the simulator product, not an academic RUL experiment.

### P3 — optional polish

- Bundle splitting, minor animation/typography refinement, and secondary visual assets.

## Root causes

The repository was designed as a real-time predictive-maintenance simulation and marketing dashboard. RUL/AI terminology was applied to heuristic outputs before acquiring run-to-failure data or defining an ML experiment. Presentation features then grew around those values, while tests, provenance, model lifecycle, and academic reporting were not established. This is a necessary discovered-scope correction, not a small bug in an otherwise valid model.

## Category summary

| Category | Status |
|---|---|
| Data / target / leakage / evaluation | P0 invalid or absent |
| Features / model selection | P0 absent; existing trends are heuristic |
| Python architecture / local safety | P1–P2 repairable |
| UI | P1 honesty gap; P2 maintainability; visually strong baseline |
| Tests / reproducibility / docs | P1 absent |

## P0/P1 evidence commands

- `rg --files ...`: no dataset, tests, training, evaluation, notebook, or model files.
- `python -m compileall -q backend`: pass.
- one-event import probe: generated `rul=150.8`, rule forecast `999.0`, plus `no such table: decisions` outside lifespan startup.
- `python -m pytest -q`: failed because pytest is not installed.
- `npm run build`: passed; 619.08 kB JS warning.
- `npm run lint`: failed with 14 errors and one warning.

Confidence in P0/P1 findings is high because it follows direct source, file inventory, and command evidence.
