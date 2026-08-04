# Simulation contract

Schema version `1.0`. Packs are deterministic JSON with identity, source attribution, simulation warning, dataset fingerprint, model identity, source machine IDs, asset manifest, timeline, speeds, sensors, samples, derived events, and SHA-256 content checksum.

All assets derive from official FD001 test trajectories. Predictions, bounds, status, features, and warnings come from `RULService.predict`. Scenario generation uses fixed scenario definitions and source IDs; it does not cherry-pick by prediction error. Packs never contain the complete raw dataset.

Allowed events: `ASSET_STARTED`, `STATUS_CHANGED`, `RUL_THRESHOLD_CROSSED`, `SENSOR_DEVIATION`, `RUL_REVISION`, `MAINTENANCE_DUE`, `CRITICAL_RISK`, `SIMULATION_PAUSED`, `SIMULATION_RESUMED`, `SCENARIO_RESET`. Replaying the same pack and cycle produces the same ordered event set.
