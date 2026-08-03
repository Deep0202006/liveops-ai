# Final release baseline

Date: 2026-08-03  
Branch: `audit/rul-project-strengthening`  
Starting commit: `627b16c95f1a29703484329e32c6d3b4038e452b`

## Repository protection

The working tree began with unrelated user-owned changes under `backend/`, the preserved experimental `frontend/`, and untracked root assets. They are outside this release pass. No reset, clean, checkout, deletion, staging, or history rewrite was performed. Release scope is `web/`, frontend tests/docs, deployment configuration, and tests that verify the frozen API integration.

## Reproduced product

The existing production build and Playwright suite reproduce the landing page, `/app`, direct `/app/model`, API status, demo catalogue, stateless multipart validation, machine inspection, sensor series, prediction, designed validation errors, explicit demo state, reduced motion, and required screenshot viewports. Same-origin `/api/v1` is the production default. There is no service worker or persistent browser cache layer.

## Observable baseline defects

| ID | Severity | Area | Finding |
| --- | --- | --- | --- |
| RC-01 | P1 | API resilience | `response.json()` was asserted as a generated envelope without a runtime shape guard; malformed JSON/envelopes could escape the intentional error experience. |
| RC-02 | P1 | Workflow race | Sensor-toggle series requests were not mutually cancelled or generation-checked, so a slower earlier response could replace the newest sensor selection. |
| RC-03 | P1 | RUL Horizon | One-sided/malformed ranges were partially drawn even though the textual summary correctly said no complete range was available; range endpoints also needed defensive non-negative ordering. |
| RC-04 | P1 | React resilience | No route/workspace/chart error boundaries protected the application from unexpected render or lazy-chunk failures. |
| RC-05 | P1 | Production routing/security | Vercel configuration lacked static security headers and automated assertions for API-versus-SPA rewrite ordering. |
| RC-06 | P1 | Release coverage | Existing browser coverage was Chromium-only and demo-mode only; no genuine real-artifact browser/API parity journey existed. |

No P0 defect was observed. Browser console/API log cleanliness, cross-browser execution, clean installation, production-like real prediction, accessibility automation, zoom coverage, and race/error matrices were not yet proven at baseline and therefore were not classified as passing.

## Design-conformance matrix

| Area | Baseline classification | Note |
| --- | --- | --- |
| Landing navigation, hero, evidence, workflow, preview, transparency, footer | MATCHES SPECIFICATION | Correct sequence and restrained Signal Foundry hierarchy. |
| RUL Horizon | POLISH REQUIRED | RC-03 and broader edge-case coverage required. |
| Workspace navigation and status | MATCHES SPECIFICATION | Demo/real state remains textual and visible. |
| Upload, validation, machine selection and inspection | MATCHES SPECIFICATION | Recovery and rapid replacement require stronger tests. |
| Sensor chart | FUNCTIONAL DEFECT | RC-02; visual/chart semantics otherwise conform. |
| Prediction and evidence panel | MATCHES SPECIFICATION | Prediction remains visually dominant. |
| Model Evidence | MATCHES SPECIFICATION | Demo metrics remain explicitly non-publishable. |
| System drawer and mobile navigation | ACCESSIBILITY DEFECT | Existing focus trap needs automated release proof. |
| Loading, empty, API unavailable and demo states | POLISH REQUIRED | Malformed/offline/timeout recovery matrix incomplete. |
| Real-model state | FUNCTIONAL DEFECT | No browser parity proof at baseline (RC-06). |

## Motion inventory baseline

| Component | Trigger | Duration | Property | Repeats | Reduced motion |
| --- | --- | ---: | --- | --- | --- |
| MetricTile | mount | 220 ms | opacity, translateY 6 px | No | immediate |
| RUL observed region | prediction mount | 340 ms | scaleX | No | immediate |
| RUL forecast line | prediction mount | 520 ms + 160 ms delay | scaleX | No | immediate |
| RUL range | prediction mount | 460 ms + 240 ms delay | scaleX | No | immediate |
| Controls | hover/press | 140–160 ms | translate ≤1 px, scale | interaction only | transforms removed |
| Spinner | request pending | 800 ms | rotation | while pending | single near-instant iteration |

No uncontrolled spring, parallax, scroll hijacking, blur animation, moving chart, infinite border glow, or repeated metric count exists.
