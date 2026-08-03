# Existing frontend audit

## Scope and repository state

Audit date: 2026-08-03. Repository root: `C:\Users\dcp69\Desktop\liveops-ai`. Branch: `audit/rul-project-strengthening`.

The working tree contained extensive pre-existing changes in `backend/`, `frontend/`, and untracked root assets before Signal Foundry work began. They are user-owned and have not been staged, modified, deleted, or reused. The canonical implementation target remains the new `web/` directory.

## Legacy frontend assessment

`frontend/` is an experimental Vite/React JavaScript application describing simulated telemetry, WebSockets, risk scoring, fault injection, ERP integration, SQL ledgers, and circular risk gauges. Those concepts conflict with the frozen Remaining Useful Life product and are not reusable. No architecture, code, screenshots, or generated imagery from that directory will be imported by `web/`.

The only terminology retained is the product name “LiveOps AI” and the domain terms machine, sensor history, cycle, and RUL, all independently confirmed by API v1.

## Integration documentation assessment

The authoritative documents consistently define a stateless browser client that resends a CSV for inspection, machine summary, series, and prediction. `docs/web-api/06-frontend-integration.md` contains stale language about registering and deleting datasets; API v1 has no registry, dataset identifier, or delete endpoint. The frozen OpenAPI and the later final API contract take precedence.

## Vercel assessment

The existing `vercel.json` configures only `api/index.py`. It does not build or route a Vite SPA. A future frontend release requires a Vite build command/output directory plus rewrites that preserve `/api/*` for FastAPI and route `/app` and `/app/model` to `index.html`. That change is deferred until the API typing blocker is resolved.

## Local API verification

Both modes were exercised on 2026-08-03 through the actual FastAPI application using `TestClient`:

- Demo mode: status is explicit, prediction is available, model metadata/evaluation and sample catalogue respond, and stateless dataset inspection, machine inspection, and prediction succeed with the documented monitor sample.
- Real mode: the checked-in real Extra Trees artifact is available, reports 100 official FD001 test machines, MAE 14.4395 cycles, and near-failure MAE 7.301754385964911 cycles. Demo samples correctly return `409 MODE_NOT_ALLOWED`.
- Responses use the success/error/meta envelope and expose request IDs.
- Machine series accepts a comma-separated `sensors` form field, not repeated multipart fields.

## Contract repair resolution

The audited OpenAPI published an empty `{}` success schema for six required operations: model metadata, model evaluation, demo samples, dataset inspection, machine inspection, and machine series. The authorized schema-only repair added explicit Pydantic response models matching the verified payloads without changing fields or behavior.

`tests/test_frontend_openapi_contract.py` now gates all eight frontend-consumed operations, validates runtime payloads against the declared models in demo and real modes, and rejects empty OpenAPI success schemas. API v1 paths, methods, fields, behavior, metrics, and version remain unchanged.
