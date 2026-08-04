# Alloy Glass layout map

## Verified current structure

`web/src/main.tsx` mounts `SimulationProvider` and `PinsProvider` above `App`, so simulation and scenario-local pins are already shared across routes. `web/src/app/App.tsx` currently maps `/` and `/asset/:assetId` to `CommandCenterPage`, `/maintenance` to its maintenance mode, `/compare` to `ComparePage`, `/model` to `ModelEvidencePage`, and `/lab` plus legacy `/app` aliases to `WorkspacePage`. `AppShell` supplies a fixed 76 px rail to every route.

## Target route and shell map

| Route | Surface | Loading boundary |
|---|---|---|
| `/` | Pearl Mist landing story | landing bundle; reduced preview uses the shared simulation context |
| `/command` | Smoked Alloy command center | command route bundle |
| `/asset/:assetId` | command center with asset focused | command route bundle |
| `/maintenance` | maintenance operational view | command route bundle |
| `/compare` | pinned comparison | existing lazy boundary retained |
| `/model` | Model Evidence | existing lazy boundary retained |
| `/lab` | Data Lab | existing lazy boundary retained |

Legacy `/app` and `/app/model` may redirect to `/lab` and `/model`; they must not become additional designs. Navigation labels remain Command Center, Fleet, Maintenance, Compare, Model Evidence, and Data Lab. Compare must be added to the verified `AppShell` navigation.

## Landing geometry

The landing canvas is full width with content capped at 1440 px and 24 px desktop gutters. The sticky floating navigation sits 16 px from the viewport edge. The hero uses a 12-column grid: copy spans columns 1–5 and the living preview spans 6–12. The evidence ribbon is one connected six-value strip. Observe → Interpret → Prioritise → Act is a single connected sequence, followed by real UI fragments, a model-transparency section, and the final CTA.

## Command geometry

At 1440 × 900: 76 px navigation rail, compact top command bar, open six-value KPI ribbon, then a three-region grid: Fleet Health (minimum 280 px), Selected Asset Command View (dominant, minimum 440 px), and Alert/Maintenance Intelligence (minimum 290 px). Time Conductor floats above the bottom edge and does not resize the data regions.

At 1024 × 768: rail remains available, selected asset is first priority, fleet and intelligence become controlled secondary regions. At 768 × 1024: navigation becomes a managed mobile sheet/bottom entry, selected asset precedes fleet, and alert/maintenance is switchable. At 430, 390, and 360 px widths the order is simulation status, RUL, asset identity, immediate alert/action, telemetry, fleet, maintenance, time controls. No operational chart creates page-level horizontal overflow.

## Stable domain boundaries

Do not move `simulation/`, `comparison/`, API queries, alert selectors, or uPlot update logic for appearance. Presentation decomposition should occur around landing, shell, fleet, selected asset, alerts, maintenance, and effects. `CommandCenterPage.tsx` is currently monolithic; extracting rendered regions is justified, but state ownership and deterministic selectors remain unchanged.
