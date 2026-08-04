# Component treatment map

| Existing element | Target treatment | Preserved source |
|---|---|---|
| `AppShell` | command glass rail and responsive managed navigation | verified route links and router semantics |
| command bar | compact command glass | scenario catalog, snapshot clock, controls, API status |
| KPI strip | open ribbon with separators and arrival glow | `FleetSnapshot` counts and median |
| `FleetTile` | solid alloy tile, thin semantic edge, strong mono RUL, Focus Trace on selection | `AssetSnapshot`, pin provider |
| `CompactHorizon` / `RULHorizon` | elevated RUL-dominant region, shared thresholds, readable range | actual bounds/status and metadata thresholds |
| `TelemetryChart` | integrated opaque chart, muted grid, compact legend, stable sensor colours | uPlot and existing history slices |
| alert filter/feed | compact solid operational list, severity rail, Alert Wake | actual event enum and immutable filters |
| `MaintenanceQueue` | ranked operational table/list with reviewed state | deterministic queue/action logic |
| `ComparePage` | one elevated decision surface with shared axes and persistent asset colours | comparison selectors and scenario sensors |
| command palette | command glass with grouped commands and managed focus | existing commands and keyboard shortcut |
| Model Evidence | lighter evidence/data surfaces; no invented metrics | API metadata/evaluation queries |
| Data Lab | solid upload and prediction workbench | real API mutation and session-only file state |

The selected asset region is visually dominant. Its top holds identity/status, center holds the RUL Horizon, and bottom holds telemetry/evidence/trend. Important features and warnings are subordinate evidence, not competing cards.

Alert and maintenance share one intelligence column on desktop. Tablet switches between them without losing state. On mobile the immediate highest-severity event precedes telemetry while the complete lists follow fleet. Comparison preserves one sensor at a time and common axes; it must not become three independent asset cards.
