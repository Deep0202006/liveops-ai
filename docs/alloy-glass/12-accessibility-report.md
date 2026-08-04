# Alloy Glass Accessibility Report

Date: 2026-08-04

Branch: `feat/alloy-glass-command-center`
Result: **PASS - no serious or critical violations in tested states**

## Automated result

Chromium axe checks used WCAG 2.0 A/AA and WCAG 2.1 A/AA rule tags. No serious
or critical violations remained in these verified states:

- Pearl Mist landing page
- command center
- Data Lab, including invalid-CSV recovery and its alert state
- maintenance queue
- Model Evidence
- combined alert filters
- two-asset pinned comparison
- command center at 200% text scale
- landing at 200% text scale on a 430x932 viewport

These checks are part of the complete Playwright result of **82 passed and 86
intentional skips**. Axe is intentionally scoped to Chromium; keyboard,
responsive, and critical functional journeys also ran in Firefox and WebKit.

## Implemented accessibility behavior

- A skip link is the first keyboard stop and moves focus to `#main-content`.
- All application navigation, simulation, pin, filter, comparison, palette,
  maintenance, and Data Lab controls expose accessible names.
- Visible focus is retained on the command navigation and interactive controls.
- Mobile navigation moves focus to its close control, closes with Escape, and
  does not trap focus after dismissal.
- Opening comparison focuses the `Operational comparison` heading; asset
  removal and full-investigation actions remain keyboard accessible.
- Status, severity, pin state, RUL, chart summaries, and maintenance priority
  are expressed in text rather than colour alone.
- Alert filter result changes use a polite result-count announcement; critical
  alerts are not repeatedly announced on every simulation tick.
- Invalid CSV feedback uses an alert semantic while uploaded data remains
  session-memory only.
- Local Geist typography, minimum control/body sizes, tabular technical values,
  and opaque operational surfaces preserve readability over glass controls.

## Reduced motion and zoom

The reduced-motion gate disables Telemetry Aurora drift, refraction sweep,
critical beacon, hero depth drift, and movement-based route treatment. It
preserves status changes and simulation updates. The depth-effect test also
proved that a reduced-motion pointer interaction leaves the preview transform
at `none`.

At 200% text scale, automated axe checks remained clean. The 430 px landing
viewport retained zero horizontal overflow, and the command center kept the
live simulation state visible. Responsive overflow checks additionally passed
at widths of 360, 390, 430, and 768 px.

## Filter and comparison coverage

The filter gate exercises labelled severity and asset controls before scanning
the command center. The comparison gate pins two assets, opens comparison,
asserts focus management, and then scans the resulting operational view. This
supplements the existing functional coverage for filter reset/empty states,
three-pin limits, chart text summaries, and keyboard operation.

## Browser scope and limitations

- Automated axe analysis is Chromium-only because that is the configured
  accessibility instrumentation target. Equivalent detailed rule-engine parity
  is not claimed for Firefox or WebKit.
- Cross-browser functional verification passed, including focus-sensitive and
  responsive journeys; Firefox and WebKit stability passed **2 tests** over
  approximately **10.5 minutes**.
- Preview and production accessibility verification remains pending behind the
  authenticated Vercel-project identity gate.
