"""Optional temporary Streamlit client; all product logic lives behind HTTP API v1."""

import hashlib
import os
from pathlib import Path

import pandas as pd
import streamlit as st

from liveops_web_client import ApiClient, ApiClientError

API_URL = os.environ.get("LIVEOPS_API_URL", "http://127.0.0.1:8000").rstrip("/")
MAX_UPLOAD_BYTES = 4 * 1024 * 1024


@st.cache_resource
def api_client(base_url: str) -> ApiClient:
    return ApiClient(base_url)


def clear_input_state() -> None:
    for key in ("input_name", "input_bytes", "inspection", "machine_id", "prediction", "series", "machine_context"):
        st.session_state.pop(key, None)


def show_error(error: ApiClientError) -> None:
    st.error(str(error))


st.set_page_config(page_title="Machine RUL Predictor", layout="wide")
st.title("Factory Machine Remaining Useful Life")
st.caption("OPTIONAL TEMPORARY DEVELOPMENT CLIENT — TO BE REPLACED BY FINAL FRONTEND")
client = api_client(API_URL)
try:
    status = client.status()
except ApiClientError as exc:
    st.error(f"API unavailable at {API_URL}. Start the FastAPI service. {exc}"); st.stop()

context = f"{API_URL}:{status['run_mode']}:{status['api_version']}:{status['artifact_state']}:{status['model_state']}"
if st.session_state.get("api_context") != context:
    clear_input_state(); st.session_state["api_context"] = context

st.write(f"API: `{API_URL}` · Mode: `{status['run_mode'].upper()}` · API v{status['api_version']}")
if status["demo_only"]:
    st.warning("DEMO ONLY — synthetic software-verification data; metrics are not publishable accuracy.")
elif not status["prediction_available"]:
    st.warning("Real mode is active, but the real model artifact is unavailable. Prediction is blocked honestly.")

overview, prediction_tab, degradation_tab, evaluation_tab = st.tabs(["Overview", "Machine Prediction", "Degradation Analysis", "Model Evaluation"])
with overview:
    cols = st.columns(4)
    for column, label, key in zip(cols, ("Dataset state", "Model state", "Artifact state", "Metrics state"), ("dataset_state", "model_state", "artifact_state", "metrics_state"), strict=True):
        column.metric(label, status[key])

with prediction_tab:
    sources = ["Upload CSV"]
    samples = []
    if status["demo_only"]:
        sources.insert(0, "Bundled synthetic sample")
        try: samples = client.demo_samples()
        except ApiClientError as exc: show_error(exc)
    source = st.radio("Input source", sources, horizontal=True)
    candidate: tuple[str, bytes] | None = None
    if source == "Bundled synthetic sample" and samples:
        labels = {item["display_name"]: item for item in samples}; label = st.selectbox("Bundled trajectory", tuple(labels))
        selected_sample = labels[label]; path = Path("data/sample") / selected_sample["filename"]
        candidate = (path.name, path.read_bytes())
    else:
        uploaded = st.file_uploader("CSV file (maximum 4 MiB)", type=["csv"])
        if uploaded is not None:
            candidate = (uploaded.name, uploaded.getvalue())
    if candidate is not None:
        identity = hashlib.sha256(candidate[1]).hexdigest()
        if st.session_state.get("source_key") != identity:
            clear_input_state(); st.session_state["source_key"] = identity
        if len(candidate[1]) > MAX_UPLOAD_BYTES:
            clear_input_state(); st.error("UPLOAD_TOO_LARGE: CSV exceeds 4 MiB.")
        elif st.button("Validate dataset"):
            try:
                inspection = client.inspect(*candidate)
                st.session_state.update(input_name=candidate[0], input_bytes=candidate[1], inspection=inspection)
            except ApiClientError as exc:
                clear_input_state(); show_error(exc)
    inspection = st.session_state.get("inspection")
    if inspection:
        selected = st.selectbox("Machine", inspection["machine_ids"])
        machine_context = f"{st.session_state['source_key']}:{selected}"
        if st.session_state.get("machine_context") != machine_context:
            st.session_state.pop("prediction", None); st.session_state.pop("series", None); st.session_state["machine_context"] = machine_context
        try:
            summary = client.machine_summary(st.session_state["input_name"], st.session_state["input_bytes"], selected)
            st.write(f"{summary['observation_count']} observations through cycle {summary['latest_cycle']}")
            if st.button("Predict RUL", disabled=not status["prediction_available"]):
                st.session_state["prediction"] = client.predict(st.session_state["input_name"], st.session_state["input_bytes"], selected)
            result = st.session_state.get("prediction")
            if result:
                st.metric("Predicted Remaining Useful Life", f"{result['predicted_rul']:.2f} {result['rul_unit']}")
                st.write(f"Maintenance status: `{result['maintenance_status']}`")
                if result["lower_bound"] is not None: st.write(f"Validation-based estimated range: {result['lower_bound']:.2f}–{result['upper_bound']:.2f} {result['rul_unit']}")
                for warning in result["warnings"]: st.warning(warning)
                st.write("Important features: " + ", ".join(result["important_features"]))
        except ApiClientError as exc:
            st.session_state.pop("prediction", None); show_error(exc)

with degradation_tab:
    inspection = st.session_state.get("inspection"); context_value = st.session_state.get("machine_context")
    if inspection and context_value:
        selected = context_value.rsplit(":", 1)[-1]
        try:
            summary = client.machine_summary(st.session_state["input_name"], st.session_state["input_bytes"], selected)
            sensor = st.selectbox("Sensor", summary["available_sensor_columns"])
            series = client.machine_series(st.session_state["input_name"], st.session_state["input_bytes"], selected, [sensor])
            st.line_chart(pd.DataFrame({"cycle": series["cycle"], sensor: series["series"][sensor]}).set_index("cycle"))
        except ApiClientError as exc: show_error(exc)

with evaluation_tab:
    if status["prediction_available"]:
        try:
            evaluation = client.evaluation(); st.write(f"Metrics state: `{evaluation['metrics_state']}`")
            if status["demo_only"]: st.warning("Demo evaluation is synthetic and not publishable.")
            st.dataframe(pd.DataFrame(evaluation["validation_models"]), hide_index=True)
        except ApiClientError as exc: show_error(exc)
    else:
        st.warning("Evaluation is unavailable until a real model is trained.")
