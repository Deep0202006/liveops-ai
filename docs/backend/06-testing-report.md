# Testing Report

Final focused suite: **28 tests passed in 33.03 seconds** on Python 3.14.2.

Covered guarantees include target final-cycle/cap/multiple machines, numeric/finite/exact schema, duplicate and invalid cycles, chronological sorting, cycle-gap and constant-sensor warnings, causal future-row independence, stable feature order, machine-disjoint reproducible split, explicit three-way overlap failure, equal candidate samples, deterministic selection/fingerprint/range, artifact save/load/corruption/version/schema/model-name failures, missing/partial artifacts, typed cached service predictions, non-negative output, ranges, explanations, status/warnings, repeated calls, invalid requests, clean CLI failure, and synthetic CLI/end-to-end flow.

Commands:

```powershell
python -m pytest -q
python -m compileall -q src scripts tests
```

Synthetic metrics are never copied into academic performance documentation.
