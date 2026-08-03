# Existing Work Verification

**Verified:** 2026-08-02  
**Repository:** `C:/Users/dcp69/Desktop/liveops-ai`  
**Branch:** `audit/rul-project-strengthening`  
**Starting commit:** `8247933`

## Repository safety

The five reported commits exist in order: `018aca0`, `d73f08c`, `1cdf286`, `78786b5`, and `8247933`. The worktree still contains extensive pre-existing modified, deleted, and untracked legacy backend/frontend work. It was not reset, cleaned, staged, deleted, or rewritten. No authorized C-MAPSS files and no generated model artifacts are present.

## Claim verification

| Previous claim | Status | Evidence |
|---|---|---|
| Audit documents exist | VERIFIED | `docs/audit/00` through `10` and `audit-state.yaml` |
| Final documents exist | VERIFIED | Seven documents under `docs/final` |
| Cycle-based target generation | VERIFIED | `target.py:add_rul_target`; target is `max_cycle - cycle`; final cycle is 0; cap is explicit |
| C-MAPSS schema validation | PARTIALLY VERIFIED | `config.py:DatasetSchema` and `validation.py`; required/numeric/finite/duplicate checks exist, but policies, missing cycles, constant sensors, specific exceptions, and unsupported units are absent |
| Trajectory validation | PARTIALLY VERIFIED | Sorting and duplicate checks exist; minimum history is enforced only in inference and multiple validation cases are missing |
| Causal trailing features | VERIFIED | `features.py` groups by machine, sorts first, uses non-centered trailing mean/std and current-minus-previous delta; future-row mutation test passes |
| Machine-disjoint split | VERIFIED | `splitting.py:split_by_machine` splits unique IDs deterministically and asserts train/validation disjointness |
| Final-test isolation | PARTIALLY VERIFIED | Official test input is separate in scripts; no three-way split contract/assertion exists and no real final test has run |
| Dummy, Ridge, Extra Trees comparison | VERIFIED | `training.py:candidate_pipelines` |
| Preprocessing fitted on training only | VERIFIED | imputer/scaler are inside candidate pipelines fitted to training-machine rows; validation is transformed only by fitted pipelines |
| Model selection is credible | PARTIALLY VERIFIED | Selection uses validation RMSE only; requested MAE, near-failure behavior, machine stability, runtime, size, and explainability are not considered |
| Held-out evaluation | PARTIALLY VERIFIED | `evaluate_official_test` evaluates final rows against separate official labels, but official files are absent and it has not run on real data |
| Honest metrics | VERIFIED | No real accuracy is claimed; synthetic tests do not publish metrics as model performance |
| Versioned artifacts | PARTIALLY VERIFIED | joblib, metadata, and feature schema are written and version checked; evaluation file, fingerprint, required-field validation, model/schema agreement, corruption/empty checks, removed features, and range metadata are missing |
| Feature-schema checking | VERIFIED | `inference.py` compares saved feature order with centrally regenerated order |
| Shared inference | PARTIALLY VERIFIED | feature engineering is shared, but return value is an untyped dictionary and the artifact reloads on every call; no public service exists |
| Explainability | INCORRECT | No permutation/native importance, recent-change summary, or range warnings exist |
| Prediction range | INCORRECT | No validation-residual interval exists; inference correctly states none is available |
| Streamlit startup | VERIFIED | Streamlit AppTest passes; prior verification also recorded a listening process on port 8502 |
| Thirteen passing tests | VERIFIED | `python -m pytest -q`: 13 passed in 5.40 seconds |
| Dataset blocker | VERIFIED | `data/raw/train_FD001.txt`, `test_FD001.txt`, and `RUL_FD001.txt` are absent |
| Model/artifact ready | NOT VERIFIED | `artifacts/model.joblib`, `metadata.json`, and `feature_schema.json` are absent |

## Commands executed

```powershell
git rev-parse --show-toplevel
git branch --show-current
git status --short --branch
git log -6 --oneline --decorate
git show --stat --oneline 018aca0 d73f08c 1cdf286 78786b5 8247933
rg --files src/rul_predictor scripts tests docs/final docs/audit
rg -n "..." src/rul_predictor scripts tests
python -m pytest -q
python -c "import pandas,numpy,sklearn,joblib,pytest,streamlit; ..."
```

## Repair priorities

1. Typed contracts and explicit failure states.
2. Authoritative configurable validation with specific exceptions and safe warnings.
3. Training-only constant-feature removal, richer equal-sample evaluation, deterministic selection, and residual interval.
4. Artifact integrity/provenance contract and cached service layer.
5. Readiness/validation CLI commands and expanded critical tests.

The frozen frontend and legacy simulator are intentionally outside this backend hardening scope.
