# Current frontend audit

Audit date: 2026-08-04  
Starting commit: `90111eee0911ef6b1a58a94130b748bf56b431d2`  
Branch: `feat/alloy-glass-command-center`

## Method

The current application was exercised through the existing Playwright production-like setup: FastAPI runs without reload on port 8000, Vite builds the frontend and serves the production bundle with `vite preview` on port 4173, and Chromium uses the real generated scenario catalog. Animations and caret rendering were disabled for deterministic evidence; fonts and network idle were awaited. No API, model, scenario, simulation, or application code was changed for this audit.

The existing canonical routes are `/` (Command Center), `/asset/:assetId`, `/maintenance`, `/compare`, `/model`, and `/lab`. There is currently no distinct public landing route: `/` immediately renders the operational command center. `/app` and `/app/model` are compatibility aliases for Data Lab and Model Evidence.

## Current information architecture

- A persistent 72 px desktop rail owns product identity and route navigation.
- The Command Center uses a top command bar, six-cell KPI strip, three-column operational grid, and fixed bottom Time Conductor.
- The center column contains selected-asset identity, RUL Horizon, compact metrics, telemetry controls/chart, feature evidence, and warnings.
- The right column stacks alert filtering/feed and maintenance priority.
- Comparison, Model Evidence, and Data Lab are separate full-page views under the same rail.
- Below the desktop breakpoint the rail is removed and a small menu trigger is inserted near the Time Conductor; operational regions stack vertically.

## Surface inventory

| Surface | Current treatment | Audit finding |
|---|---|---|
| Root/landing | Command Center itself | Required product-story landing surface is absent. |
| Command bar | Opaque near-black strip with outlined controls | Functionally dense but fragmented; identity, time, scenario, playback, model state, and fullscreen lack clear grouping. |
| Navigation | Narrow dark rail | Labels are very small and visually subordinate; Fleet and Command Center both link to `/`. |
| KPI strip | Six equal bordered cells | Reads as a spreadsheet header, with weak emphasis on critical operational changes. |
| Fleet matrix | Two-column tiles inside a bordered panel | RUL is readable, but tiles are tall, repetitive, and sparse; pin affordance is visually ambiguous. |
| Selected asset | Bordered panel containing further bordered panels | RUL is prominent, but nested rectangles and large unused chart space weaken the hierarchy. |
| Alerts | Dense outlined filter form plus rows | Multi-select is permanently tall and event rows compete visually with filters. |
| Maintenance | Simple ranked rows | Functional but visually underdeveloped; urgency/reason/review state do not form an immediate scan path. |
| Time Conductor | Fixed opaque footer | Dominant horizontal obstruction at desktop and a fragmented mini-toolbar at mobile. |
| Comparison | Repeated overview cards followed by large chart panels | Shared-axis behavior exists, but the first impression remains three cards and long vertical panels rather than one decision surface. |
| Model Evidence | Editorial dark page | Stronger typography than the Command Center, but oversized vertical gaps and inconsistent surface language disconnect it from operations. |
| Data Lab | Editorial workspace | Clear workflow but visually belongs to a different product family. |
| Command palette | Centered dark modal | Works functionally; lacks search, grouping, selection state, and refined glass/control hierarchy. |

## Responsive findings

The required command-center viewports were captured at 1920×1080, 1440×900, 1280×800, 1024×768, 768×1024, 430×932, and 390×844. At wide desktop, the three-column layout is information-rich but the selected view becomes narrower than its importance warrants. At 1024 px, labels and controls are compressed while the same desktop hierarchy remains. At 768 px and below the layout stacks, but it preserves desktop ordering: the entire fleet precedes the selected asset and current action. This makes a mobile operator scroll through roughly twelve fleet tiles before reaching the selected RUL, alerts, or maintenance context. The fixed Time Conductor interrupts the fleet midway and its floating mobile menu trigger has weak spatial association with navigation.

No horizontal page overflow was visible in the captured 390 px and 430 px command-center states, but the full-page mobile capture is exceptionally long and the chart/filter text becomes too small for comfortable operational scanning.

## Baseline evidence index

All files are under `docs/alloy-glass/screenshots/current/`.

### Required command-center viewport set

- `command-center-1920x1080.png`
- `command-center-1440x900.png`
- `command-center-1280x800.png`
- `command-center-1024x768.png`
- `command-center-768x1024.png`
- `command-center-430x932.png`
- `command-center-390x844.png`

### Key product states

- `selected-healthy-asset-1440x900.png`
- `selected-warning-asset-1440x900.png`
- `selected-critical-asset-1440x900.png`
- `maintenance-queue-1440x900.png`
- `alert-filters-1440x900.png`
- `three-asset-comparison-1440x900.png`
- `model-evidence-1440x900.png`
- `data-lab-1440x900.png`
- `command-palette-1440x900.png`

The mobile command-center requirement is represented by both 430×932 and 390×844 captures. A landing-page baseline cannot be captured because the current route graph has no landing page; that absence is itself a confirmed Phase 0 finding rather than an inferred gap.

## Preserve during redesign

- Real-model/scenario provenance and all values displayed from the current snapshot.
- Worker-backed deterministic replay and maximum 2 Hz snapshot delivery.
- Existing shared scales and comparison interactions.
- uPlot lifecycle and telemetry behavior.
- Alert filters, acknowledgement, maintenance review, pinning, keyboard shortcuts, direct routes, and lazy-loaded secondary routes.
- Text alternatives and live-region restraint already present in operational components.

