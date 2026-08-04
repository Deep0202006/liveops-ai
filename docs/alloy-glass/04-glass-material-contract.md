# Glass material contract

Glass is a control material, not a data-panel skin. Exactly three variants are allowed.

| Variant | Approved use |
|---|---|
| Landing glass | floating landing navigation and hero control frame |
| Command glass | command bar, navigation rail, Time Conductor, palette, modal/drawer controls |
| Compact glass | popovers, context menus, scenario selector and compact overlays |

The central `.glass-control` uses the locked 135-degree white-alpha gradient, 1 px white-alpha border, inset highlight, soft exterior shadow, and `backdrop-filter: blur(18px) saturate(122%)`. Landing adjusts opacity for Pearl Mist; command adjusts foreground and fallback for Smoked Alloy. Unsupported browsers receive `rgba(34,44,51,.96)` command fallback and an opaque light landing fallback through `@supports not (backdrop-filter: blur(1px))`.

Fleet matrix, fleet tiles, RUL telemetry, alert feed, maintenance table, comparison charts, evidence tables, and Data Lab tables are solid operational surfaces with minimal or no blur. Selected asset, RUL Horizon, selected critical state, and primary comparison summary may use elevated operational material. This allocation is the glass-overuse gate.

Moving telemetry must never sit directly beneath low-opacity text controls without the command fallback layer. Borders remain visible at 200% zoom and in WebKit fallback. Refraction is an entrance edge sweep only on landing navigation, hero frame, and command palette; it runs once and disappears under reduced motion.
