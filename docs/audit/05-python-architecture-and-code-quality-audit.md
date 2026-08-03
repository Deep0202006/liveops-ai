# Python Architecture and Code-Quality Audit

| Priority | File / function | Problem | Root cause | Risk / examiner impact | Repair |
|---|---|---|---|---|---|
| P0 | `simulator.py:generate` | Fabricates RUL from thresholds/noise | Simulator used as label source | Invalid scientific claim | Remove RUL claim from simulator; use validated run-to-failure labels |
| P0 | `risk_engine.py:evaluate` | Second heuristic mutates input RUL | Risk and target concepts conflated | Unexplainable inconsistent result | Separate risk rules from trained inference |
| P1 | `ai_reasoner.py:get_decision_success_rates` | Hard-coded “success” values increase without outcome data | Activity mistaken for learning | Fake confidence/AI | Remove examiner-facing percentages |
| P1 | `main.py:get_analytics` | “savings” is `risk × 42000` | No cost/outcome model | Fabricated value | Relabel as illustrative or remove |
| P1 | `main.py` endpoints | Raw exception text returned; unvalidated request dictionaries | Speed-first prototype | Local data/error leakage | Pydantic request schemas and safe messages |
| P1 | `risk_engine.py` | SQLite errors swallowed and prediction continues | DB availability coupled to math | Silent nondeterminism | Explicit repository/service boundary |
| P2 | `orchestrator.py` | Global simulator/risk/reasoner and infinite loop | Prototype architecture | State leaks across tests/restarts | Dependency injection or isolate legacy simulator |
| P2 | SQLite modules | Relative `decisions.db` path | Working directory assumption | Multiple DB locations | Central `Path` config |
| P2 | all backend | Sparse types, broad `except`, print logging | Prototype maturity | Hard to diagnose/test | Typed interfaces, specific exceptions, logging |
| P2 | `App.jsx` | ~2,300 lines mixing landing, telemetry, SQL mock, requests, UI | Single-component growth | Lint failures and fragile UX | Replace examiner path with focused lightweight UI |
| P2 | requirements | Unversioned, includes unused NumPy; omits ML/test/UI packages | No reproducibility process | Setup drift | Minimal bounded dependencies |

Additional findings: Python cache files were created by baseline checks but ignored by the committed ignore rules; there are no package `__init__.py` files; timestamps use deprecated-naive `datetime.utcnow`; strings show mojibake (`Â°C`, `Ïƒ`); `storage.py` is unused; feature/order metadata and artifact versioning do not exist.

Working code to preserve: Pydantic event models, simple isolated variance/EMA logic, use of parameterized SQLite statements, pathlib-compatible project layout potential, frontend build tooling, and the concept of clear telemetry explanations.
