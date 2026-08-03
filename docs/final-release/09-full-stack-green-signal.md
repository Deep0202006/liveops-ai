# LiveOps AI full-stack green signal

Date: 2026-08-03  
Branch: `audit/rul-project-strengthening`  
Starting commit: `627b16c95f1a29703484329e32c6d3b4038e452b`  
Ending implementation commit: `573303d`  
Product: LiveOps AI browser-based factory-machine remaining useful life prediction

## Release ledger

| Gate | Result | Verified evidence |
| --- | --- | --- |
| Backend dependencies and compilation | PASS | Activated `.venv`; `pip check` and `compileall` completed. |
| Backend suite | PASS | 57 tests passed in 48.65 seconds. |
| Backend release verifier | PASS | `VERIFIED`; dependencies, compilation, tests, FD001, artifacts, stateless OpenAPI, no registry, and Vercel entry checked. |
| API v1 contract | PASS | Exported deterministically with no Git diff; generated TypeScript drift check passes after line-ending normalization. |
| Frontend unit/component suite | PASS | 6 files and 18 tests passed. |
| Frontend typecheck/lint/build | PASS | All commands completed without errors or warnings. |
| Frontend policy verifier | PASS | 32 runtime/source files checked; dependency, `any`, internal import, demo disclosure, security, bundle, and deployment rules pass. |
| Playwright production-preview suite | PASS | 32 passed; 28 intentional non-Chromium visual/a11y/performance skips; no failures. |
| Cross-browser critical journeys | PASS | Chromium, Firefox, and WebKit each passed navigation, demo analysis, invalid-file recovery, and mobile drawer behavior. |
| Workflow race protection | PASS | All three engines passed initial-status selection, late validation/reset, file replacement, and double-prediction tests. |
| Real full-stack prediction | PASS | Chromium production build uploaded the deterministic real fixture and matched the genuine API response field-for-field. |
| Accessibility | PASS | Axe found no serious/critical violations in seven required states; keyboard error recovery, dialog Escape, focus, reduced motion, and 200% text scale passed. |
| Responsive and visual QA | PASS | Required desktop/tablet/mobile captures pass; the 390 px result has no document overflow. |
| Performance | PASS | Chromium local production preview: landing LCP 192 ms, workspace LCP 88 ms, CLS 0.00059 maximum, route transition 130 ms. |
| Production bundles | PASS | Core 125.72 KiB gzip; chart 27.34 KiB; Model Evidence 1.83 KiB; CSS 6.84 KiB gzip. |
| Production routing | PASS | `/api/*` precedes SPA rewrites; `/app`, `/app/*`, `/docs`, and `/openapi.json` targets verified. |
| Security/privacy review | PASS | No dangerous HTML/eval/persistent storage/remote runtime loads; same-origin API; no tracking, secrets, or uploaded data persistence. |
| Clean installation | PASS | Fresh Git archive, isolated Python venv and fresh `npm ci`: backend 56 passed/1 expected raw-data skip, types, typecheck, 18 frontend tests, and build passed. |
| Vercel deployment | EXPECTED EXTERNAL BLOCK | Authentication and the actual hosted build/deployment were intentionally not performed. |

## Defects found and resolved

No P0 defect was found. The release pass found and resolved these P1 defects:

1. Malformed success/error envelopes could cross the fetch boundary without a runtime structural guard.
2. `AbortSignal.any` was not sufficiently portable for the required WebKit target; timeout and caller abort were not clearly separated.
3. Slower obsolete sensor requests could replace the newest selected sensor series.
4. First-load API identity discovery could clear a file selected before the status response arrived.
5. One-sided or reversed RUL bounds could draw a misleading forecast range.
6. Route, workspace, and chart failures lacked contained recovery boundaries.
7. Metric mount opacity created a transient contrast failure; selected-machine secondary text also missed AA contrast.
8. The lazy chart propagated a 592 px intrinsic width into a 390 px document, and mobile metric values clipped.
9. Asynchronous mode/sample insertion produced workspace CLS of 0.0613; stable semantic placeholders reduced it to 0.00059.
10. Production routing lacked asserted docs/OpenAPI routing and security headers; the build used `npm install` rather than `npm ci`.
11. The test extra omitted Streamlit and could not collect the suite in a clean environment.
12. OpenAPI drift checking produced a CRLF/LF false failure in clean Windows archives.
13. The official Geist npm wrapper pulled an unused Next.js peer tree; local official font assets are now used without that package.
14. A missing favicon produced browser-console 404 errors.
15. Mobile demo-sample controls retained a horizontally scrolled/clipped label after selection.

All listed defects have a passing regression gate or deterministic visual check.

## Design-conformance matrix

| Area | Final classification | Evidence |
| --- | --- | --- |
| Landing navigation, hero, evidence strip, process, preview, transparency, CTA, footer | MATCHES SPECIFICATION | Seven responsive landing captures; API-backed metadata; no fake live feed. |
| RUL Horizon | MATCHES SPECIFICATION | Exact linear history/forecast, ordered complete ranges, missing-range summary, status/unit labels, reduced motion, edge tests. |
| Upload, validation, machine selection/inspection | MATCHES SPECIFICATION | File picker/drop path, real samples, typed inline recovery, 100-machine-friendly grid, keyboard selection. |
| Sensor chart and evidence | MATCHES SPECIFICATION | Lazy Visx module, measured-cycle segments, text summary, toggles, contained mobile scrolling, chart fallback. |
| Prediction hierarchy | MATCHES SPECIFICATION | RUL remains dominant; series and evidence follow; model/request context stays subordinate. |
| Model Evidence and status drawer | MATCHES SPECIFICATION | API-backed metrics and explicit real/demo/artifact states; responsive dialog behavior. |
| Mobile navigation and all required error/empty states | MATCHES SPECIFICATION | 360–768 px captures plus mobile invalid-file and drawer journeys. |
| Accessibility, motion, and performance | MATCHES SPECIFICATION | Axe, keyboard, 200% text, reduced-motion screenshot, and measured budgets pass. |

## Motion inventory

| Component | Trigger | Duration/property | Repeats | Reduced-motion behavior |
| --- | --- | --- | --- | --- |
| Metric tile | First mount | 220 ms, translateY 6 px | No | Immediate position. |
| RUL observed region | New result | 340 ms, scaleX | No | Immediate. |
| RUL forecast line | New result | 520 ms + 160 ms delay, scaleX | No | Immediate. |
| RUL prediction range | Complete new range | 460 ms + 240 ms delay, scaleX | No | Immediate. |
| Controls | Hover/press | 140–160 ms, ≤1 px translation/small scale | Interaction only | Transform removed. |
| Focus Lens | Pointer movement on three approved cards | One CSS-variable update per animation frame | While pointer moves | No semantic dependency. |
| Loading spinner | Active request | 800 ms rotation | Only while pending | One near-instant iteration. |

No spring bounce, parallax, scroll hijacking, blur animation, moving chart line, repeated metric count, or infinite border glow remains.

## Real prediction parity

The final real-mode browser journey uses `data/sample/demo_machine_monitor.csv` with the verified artifact. For machine 9001 the captured API returned 92.3 cycles, `HEALTHY`, bounds 70.5–104.2, model `extra_trees` version `1.0.0`, and `demo_only: false`. The test compares the rendered cycle, value, unit, formatted status, bounds, important features, model identity, and demo flag to that same response; no expected value is embedded in production code.

## Security and dependency result

Vercel applies `nosniff`, strict-origin referrer policy, frame denial, restricted permissions, and a same-origin CSP. `style-src-attr 'unsafe-inline'` is narrowly retained because RUL/Visx geometry is expressed through data-driven React style attributes; scripts, fonts, images, connections, objects, framing, and form targets remain restricted. Uploaded CSVs stay in component memory and multipart requests only; reset clears references, and no local/session storage, URL trajectory, analytics, or third-party transfer exists.

`npm audit --omit=dev --audit-level=high` exits successfully. It reports two moderate React Router advisories confined to SSR hydration/open-redirect paths; this static `BrowserRouter` application has no server rendering, actions, user-controlled redirects, or `ScrollRestoration`. Moving to the currently offered v7 fix would introduce a higher-severity RSC-only advisory and unnecessary breaking change, so 6.30.4 is retained with the inaccessible paths documented. Backend output includes deprecation warnings from Starlette/httpx and joblib/NumPy compatibility paths; tests and runtime behavior pass.

## Screenshot inventory

Reviewed baselines include landing at 1440×900, 1280×800, 1024×768, 768×1024, 430×932, 390×844, and 360×800; workspace idle/validating/error/machine/result; dedicated RUL Horizon; Model Evidence; API unavailable; demo warning; status drawer; mobile result; and reduced-motion result. Files are stored in `docs/frontend/screenshots/`. No P0/P1 overlap, clipping, hidden warning, chart collision, or page-level horizontal overflow remains.

## Files changed

Changes are confined to `web/`, `vercel.json`, `pyproject.toml` test dependency metadata, frontend release documentation, and generated screenshot evidence. The preserved experimental `frontend/`, unrelated `backend/`, and user-owned root assets were not staged or modified by this release work.

## Commands and deployment starting point

Local production-equivalent browser verification starts with:

```powershell
.\.venv\Scripts\python.exe -m uvicorn api.index:app --host 127.0.0.1 --port 8000
cd web
npm ci
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
```

The authenticated Vercel starting point is repository-root `vercel.json`: build `cd web && npm ci && npm run build`, output `web/dist`, FastAPI function `api/index.py`, and included `artifacts/**`. The only remaining action is an authenticated Vercel build and deployment followed by hosted smoke verification.

## Final status

```text
PRODUCT: LIVEOPS AI BROWSER WEBSITE
FRONTEND: SIGNAL FOUNDRY COMPLETE
FRONTEND BUILD: VERIFIED
BACKEND: VERIFIED
REAL MODEL: VERIFIED
API V1: FINAL AND FROZEN
FULL-STACK REAL PREDICTION: VERIFIED
WORKFLOW RACE CONDITIONS: VERIFIED
STALE-STATE PROTECTION: VERIFIED
RESPONSIVE QA: VERIFIED
CROSS-BROWSER QA: VERIFIED
VISUAL REGRESSION: VERIFIED
ACCESSIBILITY: VERIFIED
REDUCED MOTION: VERIFIED
PERFORMANCE BUDGETS: VERIFIED
SECURITY REVIEW: VERIFIED
PRODUCTION-LIKE LOCAL BUILD: VERIFIED
CLEAN INSTALLATION: VERIFIED
VERCEL ROUTING READINESS: VERIFIED
KNOWN P0 DEFECTS: NONE
KNOWN P1 DEFECTS: NONE
ONLY REMAINING ACTION: AUTHENTICATED VERCEL BUILD AND DEPLOYMENT
GREEN SIGNAL FOR VERCEL: YES
```
