# Local development

Install `pip install -e ".[test]"`, set `LIVEOPS_MODE`, and start `python -m uvicorn api.index:app --reload --host 127.0.0.1 --port 8000`. Run tests with `python -m pytest -q`. Streamlit is optional: install `.[app]`, set `LIVEOPS_API_URL`, and run `streamlit run app.py`.
