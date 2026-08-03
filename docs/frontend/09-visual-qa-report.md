# Visual QA report

Screenshots are stored under `docs/frontend/screenshots/` for 1440×900, 1280×800, 1024×768, and 390×844 landing views plus workspace idle, validating, validation error, machine selection, prediction result, Model Evidence, API unavailable, demo mode, and reduced motion.

Review found and resolved two P1 issues: the prediction screenshot initially captured the workflow label instead of waiting for the result region, and below-fold metric tiles remained at their initial reveal state during full-page capture. The browser assertion now waits for `#prediction-result`; metric reveal runs once on mount. The RUL forecast width was also made explicitly linear from observed cycle to estimated horizon.

No P0 or remaining P1 overlap, clipping, horizontal overflow, chart overflow, mobile-ordering, or contrast defects were observed. The 390 px page preserves the prediction-first hierarchy, readable headings, stacked evidence, and accessible controls.
