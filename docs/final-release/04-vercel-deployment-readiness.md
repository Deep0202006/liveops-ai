# Vercel deployment readiness

`api/index.py` exports the FastAPI `app` without Uvicorn, training, download, writing, Streamlit, or raw-data dependency. `.python-version` selects Python 3.12. `vercel.json` includes artifacts and excludes tests, raw data, Streamlit client, legacy components, and documentation. `.vercelignore` narrows upload scope.

Vercel CLI 58.4.4 was executed on 2026-08-02. `vercel build --yes` was blocked before framework analysis by an invalid local Vercel authentication token. Build success is therefore **not verified**; account authentication/linking remains an external release step.
