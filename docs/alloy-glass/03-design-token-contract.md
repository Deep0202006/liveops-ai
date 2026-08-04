# Alloy Glass design-token contract

Tokens live centrally in `web/src/design-system/tokens.css` and `typography.css`. Components may consume semantic tokens only; no purple, neon cyan, pure black, or per-component type scales.

## Colour

Landing: `#E5E8E8` canvas, `#ECEDEB` warm canvas, `rgba(255,255,255,.56)` surface, `rgba(249,251,250,.78)` elevated surface, `rgba(255,255,255,.76)` glass edge, `rgba(47,61,68,.10)` muted edge, `#182025` ink, `#55636B` secondary, `#7C878D` tertiary.

Command: `#151C21` canvas, `#192127` raised canvas, `#1D262C` surface 1, `#232E35` surface 2, `#2A363E` surface 3, `rgba(35,46,53,.82)` soft surface, `rgba(222,237,240,.105)` border, `rgba(226,240,243,.17)` strong border, `#EEF3F3` text, `#A8B4BA` secondary, `#77858C` tertiary.

Signals: primary `#68C8B8`, blue `#75A8D7`, amber `#D0A462`, critical `#DA7377`, healthy `#76C495`, neutral `#98A7AF`, with the locked soft alpha values. Signals encode status and selection; status text remains mandatory.

## Typography

Only local Geist Sans (`Geist`) and Geist Mono assets already loaded by `web/src/styles/index.css` are permitted. Scale: display 56/60, hero mobile 38/42, page title 32/38, section title 24/30, panel title 18/24, body 14/21, control 13/18, technical label 12/16. Weights: 450 body, 550 controls, 600 titles. Metrics, cycles, time, asset IDs, and model versions use Geist Mono with `font-variant-numeric: tabular-nums`. Uppercase is restricted to short system labels.

## Geometry and spacing

Spacing sequence: 4, 8, 12, 16, 20, 24, 32, 48, 64, 96 px. Radii: compact control 10 px, control 12 px, operational panel 16 px, modal 20 px, hero frame 28 px. Borders are 1 px. Pill geometry is reserved for status capsules, compact segmented controls, simulation badges, and small filters.

## Elevation

Operational surfaces rely on border and tonal separation. Elevated operational surfaces may add one soft shadow and restrained signal ambience. Glass controls use the centralized material shadows. Continuous glow and animated box-shadow are prohibited.
