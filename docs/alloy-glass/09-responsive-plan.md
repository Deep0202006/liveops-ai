# Responsive plan

| Viewport | Layout decision |
|---|---|
| 1920×1080 | centered maximum-width landing; full three-region command grid with comfortable gutters |
| 1440×900 | anchor command surface: persistent 76 px rail, three regions, floating Time Conductor |
| 1280×800 | narrower fleet/intelligence regions; selected asset stays dominant; compact bar labels |
| 1024×768 | selected asset first; fleet collapsible; alert/maintenance switcher; compact conductor |
| 768×1024 | single primary column, managed nav entry, synchronized stacked comparison |
| 430×932 / 390×844 / 360×800 | required mobile information order; no page overflow; chart summaries available before plots |

Desktop landing hero is a split layout. Below 1024 px it stacks copy above preview and disables Depth Drift. Mobile navigation retains both identity and Open Command Center without obscuring the hero.

Command mobile order is simulation state, RUL, asset identity, immediate alert/action, telemetry, fleet, maintenance, then time controls. The fleet becomes a readable one-column/compact list where two columns would reduce labels below 12 px. Charts use container width and reduce tick density rather than introducing horizontal page scroll. Comparison sections stack but retain the same cycle/window, scale, colours, and legend.

Controls have at least 44×44 px touch targets on touch layouts. Sticky/fixed elements reserve safe-area inset and never cover focused controls. Text zoom at 200% reflows rather than clips. At every breakpoint, body ≥14 px, control labels ≥13 px, technical labels ≥12 px, and primary metrics remain legible.

Verification includes CSS overflow probes (`scrollWidth <= clientWidth`), focus visibility, chart labels, sticky layers, mobile menu focus restoration, rotation, reduced motion, and backdrop-filter fallback in Chromium, Firefox, and WebKit.
