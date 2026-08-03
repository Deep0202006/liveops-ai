# Local development setup

Use Python 3.12 and `python -m pip install -e ".[test]"`. Start FastAPI with `python -m uvicorn api.index:app --reload --host 127.0.0.1 --port 8000`. The optional Streamlit client requires `.[app]`. No launcher wrapper is required.
