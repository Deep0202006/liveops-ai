# Final frontend verification

## Contract repair

API v1 remains `/api/v1`, version `1.0`. Explicit schemas were added for model metadata, evaluation, demo samples, dataset inspection, machine inspection, and machine series. Runtime fields and behavior did not change. All eight frontend operations now reference generated component schemas.

## Frontend implementation

Stack: Vite, React 18, strict TypeScript, Tailwind CSS, TanStack Query, Motion, modular Visx, React Router, Lucide, and official Geist fonts. Routes are `/`, `/app`, and lazy `/app/model`. Runtime dependencies are limited to the approved set.

Signature components include SensorLattice, RULHorizon, MachineSignalChart, MetricTile, EvidencePanel, SystemStateChip, UploadWorkbench, FocusLensCard, and the status drawer. RULHorizon renders observed history, current cycle, API prediction/range/status/units, and a linear estimated horizon without inventing a timestamp or certainty.

The analysis reducer implements the approved deterministic state sequence. File, machine, mode, and API-version changes abort obsolete requests and clear API-derived state. Errors preserve safe codes and request IDs; raw text and stack traces are never displayed.

## Verified results

- Frontend core: 129.62 KiB gzip; lazy chart: 27.29 KiB; lazy Model Evidence: 1.83 KiB.
- Frontend component tests: 4 passed. Browser journeys: 7 passed.
- Backend regression: 57 passed.
- Required screenshots captured and reviewed; no P0/P1 defects remain after the documented fixes.
- Typecheck, ESLint, OpenAPI drift, dependency/import rules, bundle budgets, and production build pass.

Known limitations: official evaluation tiles are intentionally unavailable when the API is explicitly in demo mode; synthetic validation comparisons remain labelled non-publishable. Calibrated deployment LCP/INP measurements were not available locally.

Local frontend command: `cd web && npm install && npm run dev`. Run the API separately with `python -m uvicorn api.index:app --reload --host 127.0.0.1 --port 8000`.

Vercel integration starts from the root `vercel.json`: build `web/`, emit `web/dist`, preserve `/api/*` for `api/index.py`, and rewrite client routes to `index.html`. Account-authenticated `vercel build` remains an external deployment check.
