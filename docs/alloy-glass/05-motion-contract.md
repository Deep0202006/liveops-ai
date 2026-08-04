# Alloy Glass motion contract

`motion` 12.0.6 is already installed. No second animation library is permitted. Central exports in `web/src/design-system/motion.ts` define `fast` 120 ms, `control` 160 ms, `panel` 220 ms, `route` 300 ms, and `hero` 760 ms with shared easing.

Approved effects only:

| Effect | Trigger | Constraint |
|---|---|---|
| Telemetry Aurora | landing hero visible | two CSS radial gradients, opacity ≤ .18, 22 s drift |
| Glass Refraction Edge | landing nav/hero frame entry; palette open | once, 700–1000 ms |
| Data Arrival Glow | changed KPI, selected RUL, selected critical state | 180 ms |
| Alert Wake | new warning/critical row | translateX 6 px, 180 ms, once |
| Depth Drift | desktop hero pointer | ≤4 px, ≤.4°, ≤1.004 scale, one rAF loop |
| Focus Trace | asset selection change | once on selected tile |
| Critical Beacon | selected critical asset only | 2600 ms repeat |
| Route continuity | major routes | native View Transition when present; immediate fallback |

Animate opacity, transform, and justified SVG stroke offset. Never animate layout dimensions, large blur, or box-shadow. RUL value transitions take 180 ms on ticks and full entrance runs only when asset identity changes. uPlot lines do not redraw through decorative animation.

Reduced motion disables Aurora drift, Depth Drift, refraction, Focus Trace movement, and Critical Beacon; route movement becomes crossfade/immediate and RUL values render immediately. Visibility change pauses Aurora and preview activity. Every effect owns cleanup for rAF, listeners, and observers.
