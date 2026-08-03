# Final pre-frontend verification

- Branch: `audit/rul-project-strengthening`
- Product: browser-based RUL website
- Backend/API: verified; stateless API v1.0
- Dataset: official FD001 validated; archive SHA-256 `74bef434a34db25c7bf72e668ea4cd52afe5f2cf8e44367c55a82bfd91a5a34f`
- Model: Extra Trees, 40 estimators, capped RUL 125 cycles
- Final metrics: MAE 14.4395, RMSE 19.8544, median AE 9.3938, R² 0.7717; 100 official test machines
- Artifact: `artifacts/real/`, 36.44 MB model plus metadata/schema/evaluation/checksum manifest
- Statelessness: registry module/endpoints/config removed; multipart file required on each data operation
- Upload limit: 4 MiB, verified with HTTP 413
- Representative HTTP predictions selected by truth band: machine 20 true/predicted 16/17.88 (critical), machine 3 69/52.89 (monitor), machine 1 112/123.03 (healthy). Observed single-request latency was 126.85–176.90 ms in the local test process.
- Tests: 54 passed; definitive verifier passed all nine release gates.
- Vercel entry: `api/index.py`, import verified; raw training data and Streamlit not required
- Vercel build: blocked by invalid external CLI authentication token; not claimed verified
- Optional client: `app.py`, HTTP-only development client
- Future frontend starting point: generate client types from `docs/web-api/openapi-v1.json` and render returned status, validation, series, prediction, range, warning, and explanation values without duplicating them.

## Release file manifest

Added: `.python-version`, `.vercelignore`, `vercel.json`, `api/__init__.py`, `api/index.py`, `scripts/acquire_fd001.py`, `scripts/verify_release.py`, `tests/test_final_release.py`, the five files under `artifacts/real/`, `docs/data/00-official-dataset-provenance.md`, `docs/web-api/04-stateless-uploads.md`, and `docs/final-release/00` through `08`.

Removed: `src/rul_predictor/api/registry.py`, `docs/web-api/04-dataset-registry.md`, and the nine generated root batch wrappers (`setup-local`, `run-demo`, `run-real`, `verify-local`, website demo/real, API demo/real, and verify-website).

Updated: `.gitignore`, `README.md`, `app.py`, `pyproject.toml`, API/application/settings/models/ASGI modules, HTTP client, training/artifact/config modules and scripts, OpenAPI, affected API/client/service tests, and superseded backend/final/local/web documentation. The exact committed diff is represented by commits `2705248`, `4fc8288`, `6947718`, and the documentation commits that follow them.

The production model file is 36,441,690 bytes; the complete five-file real artifact is 36,466,735 bytes. Production dependency bundle size could not be measured because Vercel CLI authentication stopped the build before dependency installation and bundling.
