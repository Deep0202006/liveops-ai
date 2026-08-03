# Release-Candidate Baseline Verification

**Verified:** 2026-08-02

**Branch:** `audit/rul-project-strengthening`

**Starting commit:** `3d39028`

## Git safety

- Repository root is `C:/Users/dcp69/Desktop/liveops-ai`.
- All nine backend-hardening commits exist from `16ec376` through `3d39028`.
- Their diff contains `src`, `scripts`, tests, README, and documentation only; no `app.py`, `frontend/`, or legacy `backend/` path.
- Extensive pre-existing legacy modifications, deletions, and untracked assets remain preserved and unstaged.
- No dataset or artifact file is present.

## Capability verification

| Capability | Status | Evidence |
|---|---|---|
| Dependency health | VERIFIED | `python -m pip check`: no broken requirements |
| Package compilation/imports | VERIFIED | `python -m compileall -q src scripts tests` |
| Existing test suite | VERIFIED | 28 passed in 50.21 seconds |
| Exact C-MAPSS validation | VERIFIED | loader requires 26 columns; validation rejects missing/unknown/non-numeric/non-finite/duplicate/invalid trajectories |
| Cycle target and cap | VERIFIED | `target.py`; failure row is zero cycles |
| Causal shared features | VERIFIED | one implementation in `features.py`; future-row invariance test exists |
| Machine split | VERIFIED | deterministic group split plus three-way assertion helper |
| Candidate pipelines | VERIFIED | Dummy, Ridge, Extra Trees; preprocessing inside pipelines |
| Deterministic validation selection | VERIFIED | MAE/RMSE/near-failure/stability key; fixed seed/single-process ensemble |
| Real final evaluation | BLOCKED BY REAL DATA | official files absent; no metric fabricated |
| Explainability | VERIFIED | validation permutation importance, optional native importance, recent sensor changes |
| Residual range | VERIFIED | saved validation residual quantiles, non-negative inference bounds |
| Four-file artifact validation | PARTIALLY VERIFIED | presence/JSON/version/schema/model checks exist; no checksum manifest or demo/real kind isolation |
| Typed service | PARTIALLY VERIFIED | prediction/status/metadata/evaluation are typed; no list/describe methods or stable serializer |
| Stable state model | INCORRECT | one overloaded `BackendState` cannot independently express backend/dataset/model/artifact/metrics axes |
| Stable error contract | INCORRECT | exception classes exist but have no codes, safe details, or recoverability field |
| CLI expected failures | VERIFIED | validate/train/evaluate/readiness all exit 2 without traceback |
| Synthetic demonstration mode | INCORRECT | no generator, explicit demo config, isolated artifact, fixtures, or command |
| No hidden synthetic fallback | VERIFIED | scoped search found no synthetic/demo/fallback code |
| Public exports frozen | PARTIALLY VERIFIED | selected contracts exported; no declared frontend V1 contract version or complete public surface |
| Configuration validity checks | PARTIALLY VERIFIED | immutable dataclasses exist; invalid threshold/window/unit combinations are not rejected at construction |
| Selection policy | PARTIALLY VERIFIED | deterministic metrics hierarchy exists; no meaningful Dummy improvement gate or simplicity-within-5% rule |
| Artifact integrity | PARTIALLY VERIFIED | content compatibility checks exist; no file checksum manifest |
| Frontend freeze | VERIFIED | no phase diff touches frontend or `app.py` |

## Commands and expected states

```text
python -m pip check                                      -> 0
python -m compileall -q src scripts tests               -> 0
python -m pytest -q                                     -> 0, 28 passed
python scripts/validate_data.py                         -> 2, REAL_DATASET_REQUIRED
python scripts/train_model.py                           -> 2, TRAINING_FAILED: dataset absent
python scripts/evaluate_model.py                        -> 2, artifact absent
python scripts/verify_backend.py                        -> 2, explicit unavailable states
```

No raw traceback, absolute local backend path, fabricated metric, or synthetic-to-real fallback was found. The release-candidate work should address the partial/incorrect items without changing the truthful real-data status.
