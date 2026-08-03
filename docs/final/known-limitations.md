# Known Limitations

The authorized FD001 files remain absent, so the real dataset, artifact, and held-out metrics are unavailable. Demo mode verifies software behavior only; it does not simulate turbine physics or establish scientific performance.

- C-MAPSS represents simulated turbofan engines, not every factory machine or fault mechanism.
- The piecewise 125-cycle target cap is a modeling choice and reduces emphasis on very early life.
- A model can fail under sensor drift, new operating conditions, unseen faults, or maintenance resets.
- Predictions are point estimates; no calibrated interval is currently available.
- Feature importance in tree models is not causal explanation.
- Official files are not bundled; real metrics depend on authorized local acquisition.
- The legacy live simulator uses heuristic risk/RUL-like values and is not part of validated model evaluation.
- This academic project is not safety-certified and must not autonomously schedule or perform maintenance.
