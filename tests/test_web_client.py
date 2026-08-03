import httpx
import pytest

from liveops_web_client import ApiClient, ApiClientError


def envelope(data=None, error=None):
    return {"success": error is None, "data": data, "error": error, "meta": {"api_version": "1.0", "request_id": "test"}}


def test_temporary_client_uses_http_and_maps_structured_errors():
    def handler(request):
        if request.url.path.endswith("/status"):
            return httpx.Response(200, json=envelope({"run_mode": "demo"}))
        return httpx.Response(404, json=envelope(error={"code": "DATASET_NOT_FOUND", "message": "expired", "recoverable": True, "details": {}}))
    client = ApiClient("http://test", transport=httpx.MockTransport(handler))
    assert client.status()["run_mode"] == "demo"
    with pytest.raises(ApiClientError) as error:
        client.inspect("missing.csv", b"x")
    assert error.value.code == "DATASET_NOT_FOUND" and error.value.status_code == 404


def test_streamlit_source_has_only_http_client_boundary():
    source = open("app.py", encoding="utf-8").read()
    assert "liveops_web_client" in source
    assert "RULService" not in source
    assert "rul_predictor" not in source
    for forbidden in ("build_causal_features(", "maintenance_status(", "joblib", "predict_latest("):
        assert forbidden not in source
