# Strengthening Plan

Implementation order follows scientific risk before presentation.

| Priority | Current weakness / root cause | Files involved / proposed change | Impact and examiner value | Risk / test / complexity |
|---|---|---|---|---|
| P0 | Invalid threshold-derived target; no run-to-failure data | Add `src/rul_predictor/data_loading.py`, `validation.py`, `target.py`; accept validated NASA C-MAPSS FD001 official-format files; cycle target = machine max cycle − current cycle; official test offsets | Defensible cycles and source provenance | Medium regression; target/schema tests; medium |
| P0 | No leakage-safe split | Add `splitting.py` with deterministic machine-group train/validation split and official final test isolation; persist IDs/assert disjointness | Proves no machine overlap | Split tests; small |
| P0 | No shared preprocessing/model | Add causal `features.py`, sklearn pipelines, `training.py`; compare Dummy, Ridge, and one lightweight tree ensemble using validation only | Real learned value and identical transformations | Feature/leakage/E2E tests; medium |
| P0 | No honest evaluation | Add `evaluation.py`, MAE/RMSE/median AE/R², per-machine/RUL-band results, baseline table; final test evaluated from official labels | Trustworthy metrics with cycle units | Metric tests; medium |
| P0 | No artifact/inference | Add `artifacts.py`, `inference.py`, scripts; save trusted pipeline, metadata, schema; validate versions/order | Reproducible examiner prediction | Missing/schema/artifact tests; medium |
| P1 | Simulator and UI imply valid RUL before artifact | Remove/clearly isolate heuristic RUL claims; UI refuses predictions without validated artifact/data | Functional honesty | UI/manual tests; medium |
| P1 | Fake confidence/savings/success/encryption claims | Remove or label unsupported values illustrative; no random interval | Academic credibility | Text/API regression checks; small |
| P1 | Missing validation/errors | Domain exceptions with specific schema, duplicate, numeric, finite, history messages | Clear failure demonstration | Validation tests; small |
| P1 | No tests/reproducibility | Add pytest, seeds, bounded dependencies, config, dataset manifest/checksum guidance | Repeatable setup | Full suite; medium |
| P2 | Global/mixed architecture | Keep legacy code isolated; application UI calls shared inference package; central paths/logging | Maintainability and explanation | Imports/E2E; medium |
| P2 | Unsafe local endpoints/artifacts | Restrict origins/inputs; no uploaded pickle; safe exceptions | Safe local operation | API validation tests; small |
| P2 | Dense/broken examiner UI | Prefer lightweight Streamlit UI after model gate; Overview, Prediction, Degradation, Evaluation; disable unavailable views | Clear 5–7 minute demo | Startup/upload/manual checks; medium |
| P2 | Documentation absent | README, architecture, model card, dataset/evaluation reports, limitations, demo, verification | Examiner narrative | Command verification; medium |
| P3 | Bundle/visual polish | Only if P0/P1 complete | Optional polish | Low value; small |

## Dataset acquisition decision

Do not commit an unofficial download under an official name. Provide an acquisition README and validator for `train_FD001.txt`, `test_FD001.txt`, and `RUL_FD001.txt`. If the official NASA package remains unavailable, examiner metrics remain explicitly **BLOCKED** until the user supplies a legally obtained copy. Synthetic fixtures are permitted only for software tests and must be labeled as such.

## Commit batches

1. Audit documentation and state.
2. Target/schema/data-loader and split safeguards.
3. Shared training/evaluation/artifact/inference pipeline.
4. Tests and reproducibility.
5. Examiner UI and honest claim cleanup.
6. Final documentation and verification.
