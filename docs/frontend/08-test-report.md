# Test report

- Backend: 57 passed.
- Contract/parity gate: 3 frontend OpenAPI tests passed, including demo/real runtime model validation and component-schema inspection.
- Frontend unit/component: 4 passed for stale-state clearing, RUL range/status accessibility, explicit demo status, and upload input behavior.
- Playwright browser journeys: 7 passed with system Chrome.
- OpenAPI output: deterministic SHA-256 `8916078A4E9794645709B8EAD75289B087E1EC213AE45C5639A1052FCA07E413` at contract-repair time.

The reducer test proves old predictions are cleared on machine replacement, file replacement, and validation failure. Browser tests cover idle, validating, validation error, machine selection, prediction, API unavailable, demo mode, model evidence, reduced motion, and all required viewport sizes.
