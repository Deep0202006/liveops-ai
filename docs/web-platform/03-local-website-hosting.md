# Local website development

Set `LIVEOPS_MODE=demo` or `real`, then run `python -m uvicorn api.index:app --reload --host 127.0.0.1 --port 8000`. The optional Streamlit HTTP client runs separately with `streamlit run app.py`. Neither command is the deployment architecture; Vercel imports the ASGI application directly.
