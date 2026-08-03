# Temporary Streamlit Client

Root `app.py` is labelled `TEMPORARY WEB CLIENT — TO BE REPLACED BY FINAL FRONTEND`. It imports only `liveops_web_client`, calls HTTP endpoints for status/datasets/machines/series/predictions/evaluation, and renders returned values.

State is invalidated by API URL, mode, API version, model/artifact state, dataset source, dataset ID, and machine. Failed or expired datasets clear predictions. It does not instantiate `RULService` or import ML/artifact internals.
