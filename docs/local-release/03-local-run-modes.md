# Local Run Modes

Demo: `.venv\Scripts\python scripts\run_local.py --mode demo`. It may build a missing demo artifact only because demo was explicitly requested. The UI permanently labels the session synthetic and non-publishable.

Real: `.venv\Scripts\python scripts\run_local.py --mode real`. It uses only `artifacts/real` and exits clearly while the real model is absent. There is no automatic mode and no fallback.

Both default to `127.0.0.1:8501`. A conflict is not resolved by killing a process or changing ports silently; use `--port 8502`. Trusted LAN mode is explicit: `python scripts/run_local.py --mode demo --allow-lan`. It binds `0.0.0.0`, has no authentication, and is suitable only for a trusted private network—not public internet exposure.
