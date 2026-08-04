# Alloy Glass Visual QA Report

Date: 2026-08-04

Branch: `feat/alloy-glass-command-center`
Result: **PASS - local production verification**

## Acceptance result

The Pearl Mist landing surface and Smoked Alloy operational surface passed the
locked anchor and final visual checks. Glass remains confined to control
surfaces; fleet, telemetry, alerts, maintenance, and comparison data use solid
operational surfaces. RUL is the dominant command metric, the landing page tells
the model-backed product story, and the command center does not regress into a
generic card dashboard.

| Check | Result |
|---|---|
| Landing premium quality and colour grading | PASS |
| Living model-backed preview | PASS |
| Glass hierarchy | PASS |
| Glass overuse | NO |
| Command-center hierarchy and readability | PASS |
| RUL, telemetry, alerts, maintenance, comparison, time controls, and palette | PASS |
| Desktop, tablet, and mobile layout | PASS |
| Reduced-motion presentation | PASS |
| Horizontal page overflow | NONE at tested widths |
| P0/P1 visual defects | NONE known |

## Automated evidence

- Full Playwright matrix: **82 passed, 86 intentionally skipped**. Skips are
  declared scope controls, principally Chromium-only deterministic screenshots
  and axe/motion instrumentation; they are not hidden failures.
- Critical journeys ran in Chromium, Firefox, and WebKit. The separate
  Firefox/WebKit production stability gate passed **2 tests** over approximately
  **10.5 minutes**.
- The Alloy visual suite froze simulation state, waited for local Geist fonts,
  disabled animation/carets, and covered landing hero desktop/tablet/mobile,
  evidence ribbon, connected product story, final CTA, three command scenarios,
  and the mobile command state.
- Visual regression passed **twice consecutively**: once within the complete
  Playwright verification and once as the targeted deterministic Chromium
  repeat. This is not a claim of pixel-baseline parity in Firefox or WebKit.
- Anchor conformance passed its three Chromium checks for desktop landing,
  desktop command center, and mobile horizontal overflow.

## Screenshot evidence

Final anchor evidence:

- `docs/alloy-glass/screenshots/anchors/landing-1440x900.png`
- `docs/alloy-glass/screenshots/anchors/landing-mobile-390x844.png`
- `docs/alloy-glass/screenshots/anchors/command-1440x900.png`
- `docs/alloy-glass/screenshots/anchors/command-mobile-390x844.png`

The pre-redesign baseline remains in
`docs/alloy-glass/screenshots/current/`, including seven command-center
viewports plus healthy, warning, critical, alert-filter, maintenance,
comparison, Model Evidence, Data Lab, and command-palette states. It is retained
as the review reference rather than represented as final-design evidence.

The 30-minute end state is captured by the soak harness alongside its start and
midpoint screenshots. The machine-readable soak result is the authoritative
evidence for the long-session state.

## Responsive and interaction review

The tested viewport set includes 1440×900, 768×1024, 430×932, 390×844, and
360×800 in automated Alloy checks, with the retained audit additionally
covering 1920x1080, 1280x800, and 1024x768. Mobile navigation uses a managed
dialog, selected RUL remains prioritized, charts do not force horizontal page
scroll, and the Time Conductor remains usable at compact widths.

Approved motion is limited to Telemetry Aurora, refraction entrance, data
arrival, alert wake, hero depth drift, focus trace, selected-critical beacon,
and route continuity. Automated checks verified the depth limits and confirmed
that reduced motion removes ambient drift, refraction animation, and pointer
depth without stopping functional simulation updates.

## Remaining limitations

- Deterministic pixel comparison is Chromium-specific by design. Firefox and
  WebKit are covered by functional, layout, focus, fallback, and stability
  journeys rather than claimed pixel identity.
- Preview and production visual verification remain blocked until the exact
  authorized Vercel project ID can be authenticated, as recorded in
  `docs/alloy-glass/00-blockers.md`.
