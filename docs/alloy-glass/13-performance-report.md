# Alloy Glass Performance Report

Date: 2026-08-04

Branch: `feat/alloy-glass-command-center`
Result: **PASS - local production build and wall-clock soak**

## Bundle budgets

| Measurement | Result | Budget | Status |
|---|---:|---:|---|
| Landing initial JavaScript | 73.70 KiB gzip | <=125 KiB | PASS |
| Command-center application shell | 80.95 KiB gzip | <=95 KiB | PASS |
| Command runtime including uPlot | 104.66 KiB gzip | <=125 KiB | PASS |
| Scenario catalog | 57.01 KiB gzip | <=2 MiB | PASS |

Comparison, Model Evidence, Data Lab, secondary charts, and route-specific
preview logic remain lazy. No additional charting, state, motion, 3D, WebGL,
video, Lottie, tracking, or remote-font dependency was introduced.

## Production-like browser measurement

The latest local production-build measurement recorded:

| Metric | Result | Budget | Status |
|---|---:|---:|---|
| LCP | 236 ms | monitored | PASS |
| CLS | 0 | <0.05 | PASS |
| Step interaction | 96.81 ms | normal task <100 ms | PASS |
| Telemetry-tick network requests | 0 | 0 | PASS |

Requests remained stable between scheduled route/API interactions. UI snapshot
delivery remains capped at 2 Hz, and the living landing preview presents at no
more than 1 Hz. Scenario packs are loaded as static generated assets; no request
is issued per telemetry tick.

## Official 30-minute wall-clock soak

The post-redesign Chromium soak ran against the production frontend and backend
without reload for **30.03 continuous minutes**. It used the real generated
scenario pack, Web Worker simulation, active uPlot chart, 20x simulation speed,
and the repeatable operational interaction schedule.

| Measurement | Start | End | Result |
|---|---:|---:|---|
| JavaScript heap used | 7,941,776 bytes | 7,510,436 bytes | Stable |
| DOM nodes | 2,041 | 1,989 | Stable |
| Event listeners | 278 | 276 | Stable |
| Web Workers | 1 | 1 | Stable |
| Chart instances | 1 | 1 | Stable |
| Console/API/network stability failures | 0 | 0 | PASS |
| Longest main-thread task | n/a | 100 ms | At defined soak ceiling |

The heap, DOM, and listener endpoints finish below their starting values rather
than showing an unbounded trend. Worker and chart counts remain exactly one;
there is no orphan worker, detached chart accumulation, alert duplication,
repeated scenario download, or telemetry-tick network request. The UI and
simulation controls remained responsive throughout. A 100 ms observed longest
task meets the soak harness ceiling; the measured ordinary step interaction was
96.81 ms.

Machine-readable soak evidence and screenshots are produced by
`npm run test:soak`. Detailed process/heap parity is intentionally not claimed
for Firefox and WebKit.

## Cross-browser stability

The complete Playwright matrix finished with **82 passed and 86 intentional
skips**. Short production stability sessions in Firefox and WebKit passed **2
tests** over approximately **10.5 minutes**, with stable worker cleanup and no
console/page errors. Chromium remains the detailed memory-profile target because
its debugging protocol exposes the required metrics.

## Backend environment note

One bare global-Python invocation failed because the global environment did not
contain the repository dependencies. This was an environment-path issue, not a
product regression. The same backend gates passed using the repository's
`.venv`, including the backend test suite (**62 passed**), release verification,
and scenario build/verification. No result in this report treats the failed
global interpreter invocation as a passing test.

## Dependency audit

`npm audit` reports **2 moderate React Router advisories** and **0 high or
critical advisories**. The installed v6 line has no patched release for these
findings; npm's proposed remediation is a major migration to React Router v7.
That migration is outside this presentation-layer release and requires focused
compatibility work, so the moderate findings remain a disclosed local-release
limitation rather than being hidden or force-fixed during verification.

## Remaining limitations

- The preview and production performance checks, Vercel build logs, and runtime
  log review remain blocked until the exact authorized Vercel project ID can be
  authenticated.
- The official soak's longest observed task reached 100 ms exactly. It did not
  exceed the harness stability threshold, while the ordinary interaction sample
  remained below 100 ms; this boundary measurement is disclosed rather than
  rounded down.
- The two moderate React Router advisories remain open pending a separately
  tested v7 migration; there are no high or critical npm audit findings.
