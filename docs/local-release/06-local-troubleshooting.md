# Local troubleshooting

- Import failure: activate the intended Python 3.12 environment and reinstall the appropriate project extra.
- Port occupied: select another explicit Uvicorn port; never terminate an unknown process.
- Artifact error: run `python scripts/verify_release.py`; never upload or substitute model files.
- Real data missing: raw files are needed for retraining, not runtime inference.
- Vercel build authentication: run `vercel login` with the owning account, link the project, then rerun `vercel build`.
