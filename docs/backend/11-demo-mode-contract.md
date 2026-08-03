# Demo Mode Contract

Demo mode is explicit, deterministic, and limited to software verification, frontend development, and rehearsal. Build it with `python scripts/build_demo_artifact.py`; verify it with `python scripts/verify_backend.py --mode demo`.

It writes an ignored artifact to `artifacts/demo` and small tracked synthetic examples to `data/sample`. It never writes `artifacts/real`, and real-mode loading rejects demo metadata. Returned status is `SYNTHETIC_DEMO_DATA`, `DEMO_MODEL_TRAINED`, `DEMO_ARTIFACT_AVAILABLE`, and `DEMO_METRICS_NOT_PUBLISHABLE`, with `demo_only=true`.

Demo predictions, ranges, evaluation values, and explanations exercise real backend code but are not scientific performance evidence.
