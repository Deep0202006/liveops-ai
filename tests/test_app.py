import os
from pathlib import Path
import socket
import subprocess
import sys
from time import monotonic, sleep

import httpx
import pytest
from streamlit.testing.v1 import AppTest

from rul_predictor.demo import build_demo_artifact

ROOT = Path(__file__).resolve().parents[1]


def port():
    with socket.socket() as listener:
        listener.bind(("127.0.0.1", 0)); return listener.getsockname()[1]


@pytest.fixture(scope="module")
def demo_api():
    build_demo_artifact()
    api_port = port()
    process = subprocess.Popen(
        [sys.executable, "scripts/run_api.py", "--mode", "demo", "--port", str(api_port)],
        cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    url = f"http://127.0.0.1:{api_port}"
    deadline = monotonic() + 30
    while monotonic() < deadline:
        try:
            if httpx.get(url + "/api/v1/health/live", timeout=1).status_code == 200: break
        except httpx.HTTPError: sleep(0.2)
    else:
        process.terminate(); pytest.fail("Demo API did not start")
    yield url
    process.terminate(); process.wait(timeout=10)


def test_temporary_client_communicates_over_http_and_predicts(demo_api):
    os.environ["LIVEOPS_API_URL"] = demo_api
    app = AppTest.from_file("app.py", default_timeout=30).run()
    assert not app.exception
    assert "OPTIONAL TEMPORARY DEVELOPMENT CLIENT" in app.caption[0].value
    assert "DEMO ONLY" in " ".join(item.value for item in app.warning)
    load = next(button for button in app.button if button.label == "Validate dataset")
    load.click().run()
    predict = next(button for button in app.button if button.label == "Predict RUL")
    predict.click().run()
    assert any(item.label == "Predicted Remaining Useful Life" for item in app.metric)
    text = " ".join(item.value for item in app.markdown)
    assert "Maintenance status" in text and "Important features" in text


def test_temporary_client_handles_api_unavailability():
    os.environ["LIVEOPS_API_URL"] = f"http://127.0.0.1:{port()}"
    app = AppTest.from_file("app.py", default_timeout=10).run()
    assert not app.exception
    assert "API unavailable" in app.error[0].value
