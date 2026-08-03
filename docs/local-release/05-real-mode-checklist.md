# Real Mode Checklist

Place authorized `train_FD001.txt`, `test_FD001.txt`, and `RUL_FD001.txt` under `data/raw`. Run:

```powershell
.venv\Scripts\python scripts\validate_data.py
.venv\Scripts\python scripts\train_model.py
.venv\Scripts\python scripts\evaluate_model.py
.venv\Scripts\python scripts\verify_backend.py
.venv\Scripts\python scripts\run_local.py --mode real
```

Confirm the artifact is under `artifacts/real`, its checksum manifest passes, and official final metrics exist. Until then, real mode remains blocked and demo files are never loaded.
