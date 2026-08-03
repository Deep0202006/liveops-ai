# Performance report

Measured from the Vite production build on 2026-08-03:

| Asset | Gzip |
| --- | ---: |
| Landing/workspace core JS | 129.62 KiB |
| Lazy MachineSignalChart | 27.29 KiB |
| Lazy Model Evidence route | 1.83 KiB |
| Application CSS | 6.69 KiB |

The core is below the 170 KiB landing and 230 KiB workspace budgets. Chart code is lazy and below 35 KiB gzip. A forced Motion chunk was removed because it included unused exports; Motion is now tree-shaken into the core. There are no runtime images, videos, WebGL, tracking scripts, or autoplay media. Official Geist variable fonts are self-hosted from the npm package.

`verify-bundle.mjs` enforces core, workspace, chart, and 250 KiB non-JS runtime-asset budgets. No lab LCP/INP measurement was recorded because the local environment did not provide a calibrated mobile network/CPU profile; the 2.5 s LCP and 200 ms INP values remain deployment targets, not claimed results.
