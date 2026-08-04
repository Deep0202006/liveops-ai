# Alloy Glass test plan

## Anchor gate

Capture deterministic landing hero and `/command` at 1440×900 after fonts and scenario load. Review colour balance, hierarchy, material allocation, template appearance, readability, product story, mobile plan, and projected bundles. Broad rollout proceeds only with every required gate passing and glass overuse marked no.

## Functional regression

Vitest covers selectors, filters, pin limits, prediction display, effects cleanup, reduced-motion branches, and landing preview throttling/visibility. Playwright covers scenario load/change, play/pause/step/seek/reset/speed, selection, pin/compare, all alert filters, acknowledgement, maintenance review, palette, Model Evidence, Data Lab invalid recovery, worker cleanup, route refresh/history, and reduced motion. One production-like journey uses the real API, model, and Data Lab prediction.

## Visual matrices

Landing baselines: hero desktop/tablet/mobile, evidence ribbon, connected story, final CTA. Command baselines: each scenario, healthy/warning/critical selection, paused state, filters, queue, three pins, palette, mobile, and reduced motion. Freeze scenario/cycle, await Geist fonts, and mask request IDs only. Execute twice consecutively without automatic snapshot acceptance.

## Accessibility

Automated axe plus keyboard journeys cover skip navigation, headings, glass contrast, status text, RUL/chart summaries, filters, palette/dialog focus, Time Conductor, mobile menu focus return, 200% zoom, restrained live regions, and reduced motion. Serious or critical violations block release.

## Browser and production-like coverage

Chromium, Firefox, and WebKit run critical routes and verify glass fallback, sticky controls, uPlot sizing, local fonts, upload, view-transition fallback, keyboard/touch focus, and mobile navigation. Production Vite build runs against FastAPI without reload; direct refresh, scenario/static assets, API calls, console, failed requests, and real prediction are inspected.

## Performance and longevity

Enforce landing initial JS ≤125 KiB gzip, command shell ≤95 KiB, command plus uPlot ≤125 KiB, animation increment ≤30 KiB, scenarios ≤2 MiB gzip, images ≤250 KiB, ≤2 Hz UI delivery, zero tick network requests, CLS <.05, and normal tasks <100 ms. Run the existing Chromium 30-minute wall-clock soak after redesign and retain its JSON/Markdown evidence. Comparison, Model Evidence, Data Lab, secondary charts, and route-specific preview logic remain lazy.

## Release evidence

Record command, timestamp, exit code, counts, bundle output, screenshots, console/network review, soak metrics, and limitations in reports 11–16. A build alone cannot pass visual acceptance.
