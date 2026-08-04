# Alloy Glass anchor conformance

Gate date: 2026-08-04  
Branch: `feat/alloy-glass-command-center`

## Evidence

The anchor surfaces were exercised against a production frontend build and the
FastAPI backend without reload. Chromium screenshots are stored in
`docs/alloy-glass/screenshots/anchors/` for desktop and mobile landing and
command-center states. The command surface is frozen at the initial Normal
Shift cycle for deterministic comparison.

The living landing preview uses the existing simulation provider and generated
scenario pack. It samples React presentation state at no more than 1 Hz, pauses
the simulation when the preview leaves the viewport, resumes only when it had
paused the simulation itself, and cleans its interval and observer on unmount.

## Mandatory gate

| Criterion | Result | Evidence |
|---|---|---|
| Colour balance | PASS | Pearl Mist landing and Smoked Alloy operations use only locked mineral signals. |
| Visual hierarchy | PASS | Landing headline leads into the living product; selected RUL dominates operations. |
| Glass hierarchy | PASS | Glass is limited to navigation, command, time, and overlay controls. |
| Glass overuse | NO | Fleet, telemetry, alert, maintenance, and comparison data remain solid. |
| Generic template appearance | NO | Connected landing narrative and operational three-region composition avoid a card grid. |
| Command Center readability | PASS | Shared ribbon, 46 px RUL, clear status text, and solid chart surfaces remain legible at 1440×900. |
| Landing product story | PASS | Hero, real preview, evidence ribbon, connected workflow, transparency, and final CTA are present. |
| Mobile strategy defined | YES | Mobile prioritizes simulation and selected RUL; time controls follow operational content. |
| Performance budget projected | PASS | Main entry is 75.48 KiB gzip and the lazy living preview is 1.97 KiB gzip in the anchor build. |

## Automated anchor result

`alloy-anchor-review.spec.ts` passed three Chromium tests covering the desktop
landing, desktop command center, and horizontal-overflow checks for both mobile
anchors. TypeScript and ESLint passed before capture.

This gate authorizes the targeted route and component polish phase. It is not a
substitute for the final accessibility, cross-browser, visual-regression,
performance, or soak gates.
