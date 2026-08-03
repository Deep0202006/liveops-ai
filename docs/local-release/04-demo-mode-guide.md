# Demo Mode Guide

Run `python scripts/build_demo_artifact.py`, then `python scripts/run_local.py --mode demo`. Choose a bundled healthy, monitor, or critical synthetic trajectory, select its machine, and predict. The UI renders the backend-provided cycles, maintenance status, validation-based estimated range, warnings, important features, and recent changes.

Uploads are in-memory CSV files limited to 5 MB. They must match the trained schema and are never persisted or accepted as model artifacts. Demo output verifies integration and examiner workflow only; it is not turbine physics or real accuracy.
