"""Thin stateless HTTP client for the optional Streamlit development UI."""

from dataclasses import dataclass
from typing import Any

import httpx


@dataclass(frozen=True)
class ApiClientError(Exception):
    code: str
    message: str
    recoverable: bool = True
    status_code: int | None = None

    def __str__(self) -> str:
        return f"{self.code}: {self.message}"


class ApiClient:
    def __init__(self, base_url: str, *, timeout: float = 30.0, transport=None) -> None:
        self.base_url = base_url.rstrip("/")
        self._client = httpx.Client(base_url=self.base_url, timeout=timeout, transport=transport)

    def close(self) -> None:
        self._client.close()

    def _request(self, method: str, path: str, **kwargs) -> Any:
        try:
            response = self._client.request(method, path, **kwargs); payload = response.json()
        except (httpx.HTTPError, ValueError) as exc:
            raise ApiClientError("API_UNAVAILABLE", "The LiveOps API is unavailable.", True) from exc
        if not payload.get("success"):
            error = payload.get("error") or {}
            raise ApiClientError(error.get("code", "API_ERROR"), error.get("message", "The API request failed."), bool(error.get("recoverable", True)), response.status_code)
        return payload["data"]

    @staticmethod
    def _file(filename: str, content: bytes):
        return {"file": (filename, content, "text/csv")}

    def status(self): return self._request("GET", "/api/v1/status")
    def metadata(self): return self._request("GET", "/api/v1/model/metadata")
    def evaluation(self): return self._request("GET", "/api/v1/model/evaluation")
    def demo_samples(self): return self._request("GET", "/api/v1/demo/samples")
    def inspect(self, filename: str, content: bytes):
        return self._request("POST", "/api/v1/datasets/inspect", files=self._file(filename, content))
    def machine_summary(self, filename: str, content: bytes, machine_id):
        return self._request("POST", "/api/v1/machines/inspect", files=self._file(filename, content), data={"machine_id": str(machine_id)})
    def machine_series(self, filename: str, content: bytes, machine_id, sensors: list[str], maximum_points: int = 1000):
        return self._request("POST", "/api/v1/machines/series", files=self._file(filename, content), data={"machine_id": str(machine_id), "sensors": ",".join(sensors), "maximum_points": str(maximum_points)})
    def predict(self, filename: str, content: bytes, machine_id):
        return self._request("POST", "/api/v1/predictions", files=self._file(filename, content), data={"machine_id": str(machine_id)})
