# Testing and Reproducibility Audit

## Baseline

- No Python or JavaScript tests exist in the current worktree.
- The committed Create React App test file is deleted as part of pre-existing user changes.
- `python -m pytest -q`: **BLOCKED**, `No module named pytest`.
- `python -m compileall -q backend`: **VERIFIED**.
- `npm run build`: **VERIFIED** with bundle warning.
- `npm run lint`: **BLOCKED**, 14 errors / 1 warning.

## Reproducibility gaps

Random seeds are uncontrolled; Python dependencies are unversioned; Python/Node version files are absent; dataset/version/checksum is absent; split and features are absent; model hyperparameters and metadata are absent; no artifact exists; SQLite location depends on current directory; and simulator state depends on event order/operator actions.

## Required suite

Add deterministic pytest coverage for target calculation, final cycle, cap behavior, multiple machines, duplicate/non-numeric/non-finite/missing schema validation, causal rolling features, machine-disjoint reproducible splits, artifact/schema checks, non-negative prediction, missing artifact, and an end-to-end synthetic software test. Synthetic fixtures must never be used for reported accuracy.
