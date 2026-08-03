# LiveOps AI

LiveOps AI is a lightweight browser-based Remaining Useful Life prediction website. Its stable boundary is FastAPI API v1 wrapping `RULService`; the professional frontend is the only planned implementation phase still pending. `app.py` is an optional Streamlit development client, not the product frontend.

## Verified model

The real release model is an Extra Trees pipeline trained on the official NASA C-MAPSS FD001 benchmark. Its official 100-machine test results are MAE **14.44 cycles**, RMSE **19.85 cycles**, median absolute error **9.39 cycles**, and R² **0.772**. The capped target is `min(final failure cycle - current cycle, 125)`; cap selection and model selection used only machine-disjoint internal validation.

## Local development

```text
python -m pip install -e .
python -m uvicorn api.index:app --reload --host 127.0.0.1 --port 8000
python -m pytest -q
python scripts/verify_release.py
```

Set `LIVEOPS_MODE=demo` or `LIVEOPS_MODE=real` before starting the API. The Vercel entry defaults to documented demo mode; it never falls back from explicit real mode. The optional development client uses `python -m pip install -e ".[app]"` and `streamlit run app.py`.

API docs are at `/docs`; the frozen contract is [openapi-v1.json](docs/web-api/openapi-v1.json). Stateless requests resend one CSV (maximum 4 MiB), so no database, dataset registry, authentication, or persistent upload storage is required.

## Signal Foundry frontend

The canonical production frontend is under `web/`; the existing `frontend/` directory is preserved experimental work and is not imported.

```text
python -m uvicorn api.index:app --reload --host 127.0.0.1 --port 8000
cd web
npm install
npm run dev
```

Open `http://127.0.0.1:5173`. Use `npm run verify:frontend` for generated-contract drift, type, lint, unit, build, dependency, and bundle gates; `npm run test:e2e` runs the browser journeys and screenshot baselines.

## Real training

Place the official `train_FD001.txt`, `test_FD001.txt`, and `RUL_FD001.txt` under `data/raw/`, then run:

```text
python scripts/validate_data.py
python scripts/train_model.py
python scripts/evaluate_model.py
```

Raw benchmark files are ignored by Git and are not required at prediction runtime. Provenance and limitations are documented under `docs/final-release/`.
