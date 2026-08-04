# Command Center Memory Soak Report

## Environment and method

- Chromium production preview, FastAPI without reload, real generated Normal Shift pack
- Web Worker enabled, uPlot active, UI snapshots capped at 2 Hz, simulation set to 20x
- 30 continuous wall-clock minutes; fake timers and accelerated substitution were not used
- Deterministic minute schedule covered selection, pin/unpin, comparison, window/sensor changes, filters, acknowledgement, pause/resume, backward/forward seek, speed, Maintenance, Model Evidence, Command Center, and command palette
- Samples at 0/5/10/15/20/25/30; screenshots at 0/15/30

The first complete run lasted 32.95 minutes and failed because three intentionally aborted React Query refresh requests were classified as network failures when navigation left Model Evidence. The harness was corrected to wait for evidence/network settlement. Per the directive, a fresh complete soak was run rather than reclassifying the failed result.

## Passing repeat

- Start: 2026-08-04T05:48:27.341Z
- Finish: 2026-08-04T06:18:28.575Z
- Duration: 1,801,234 ms (30.02 minutes)
- Console errors: 0
- Failed requests: 0
- API errors: 0
- Stability failures: 0

| Min | Browser private MiB | Heap used / total MiB | DOM | Listeners | Workers | Timers | Charts | Worker msg/min | Long tasks / longest | Requests after initial |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 0 | 268.50 | 7.14 / 10.30 | 1,839 | 269 | 1 | 2 | 1 | 2.0 | 1 / 77 ms | 0 |
| 5 | 243.00 | 6.25 / 12.86 | 3,776 | 367 | 1 | 2 | 1 | 0.0 | 2 / 77 ms | 4 |
| 10 | 233.55 | 8.08 / 11.11 | 1,894 | 277 | 1 | 1 | 1 | 2.0 | 2 / 77 ms | 4 |
| 15 | 281.60 | 6.86 / 10.61 | 1,825 | 275 | 1 | 3 | 1 | 0.0 | 2 / 77 ms | 13 |
| 20 | 259.10 | 7.15 / 14.11 | 3,975 | 393 | 1 | 2 | 1 | 0.0 | 3 / 77 ms | 16 |
| 25 | 248.26 | 7.63 / 10.61 | 1,835 | 275 | 1 | 0 | 1 | 0.6 | 3 / 77 ms | 16 |
| 30 | 281.11 | 7.64 / 10.86 | 1,949 | 281 | 1 | 3 | 1 | 0.0 | 4 / 77 ms | 23 |

Browser memory and heap fluctuate with route caching/JIT and finish near their warmed range rather than rising monotonically. DOM/listener spikes correspond to scheduled route states and return to baseline. Worker and chart counts remain exactly one at every sample. The two scenario resource entries are the catalog plus one pack and remain constant; no repeated pack download or telemetry-tick request occurs. Request count rises only at scheduled API-backed route visits and stays flat between interaction checkpoints.

No orphan worker, detached chart accumulation, event storm, alert duplication, console/API error, browser crash, or control degradation was observed. Longest main-thread task was 77 ms, below the 100 ms budget.

Raw metrics: `docs/command-center/soak-metrics.json`. Visuals: `screenshots/soak-minute-00.png`, `screenshots/soak-minute-15.png`, and `screenshots/soak-minute-30.png`.

React commit count is intentionally unavailable in the production build because React DevTools instrumentation is absent. Detailed process/heap parity is not claimed for Firefox/WebKit; separate 10-minute production stability sessions passed in both browsers with one stable worker and zero console/page errors.
