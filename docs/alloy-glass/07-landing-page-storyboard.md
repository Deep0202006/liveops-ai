# Landing-page storyboard

## 1. Floating navigation

Pearl Mist navigation: LiveOps AI left; Command Center, Platform, Model Evidence center; `LIVE MODEL-BACKED SIMULATION` and Open Command Center right. It is transparent-light at the top and gains opacity after scroll. Mobile exposes an accessible compact menu.

## 2. Hero and living preview

Headline: “See machine risk forming before downtime takes control.” Supporting copy uses the directive text. CTAs lead to verified target routes `/command` and `/model`. Trust labels state NASA C-MAPSS FD001, real trained RUL model, deterministic live simulation, and no physical factory connection.

The right-side hero frame consumes the existing shared simulation snapshot: six assets from `scenario.asset_manifest`, one selected asset, current RUL/range/status, one uPlot trace, simulation cycle, one event, scenario title, and play/pause. It samples presentation at ≤1 Hz, pauses via IntersectionObserver and document visibility, and does not import `CommandCenterPage`. Telemetry Aurora grades the background; Depth Drift applies only above 1024 px with fine pointer input.

## 3. Evidence ribbon

One connected ribbon reads dataset/model identity from metadata and scenario source, and test machines, MAE, and near-failure MAE from evaluation. Values are never duplicated as literals in the landing component.

## 4. Connected product narrative

Observe uses fleet telemetry; Interpret centers RUL and uncertainty; Prioritise uses maintenance ordering; Act uses alert acknowledgement/review. A continuous rule and progressive real interface fragments connect the stages—no equal feature-card grid.

## 5. Capability and transparency sequence

Fleet visibility, asset investigation, live alerting, maintenance prioritisation, time control, and comparison use real interface fragments. Model transparency covers dataset, target, model, RUL cap/range, deterministic simulation, and limitations using API/scenario facts.

## 6. Final action

“Enter the Reliability Command Center” links to `/command`. Route continuity uses native View Transition where available and immediate navigation elsewhere.
