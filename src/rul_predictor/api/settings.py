"""Immutable web API configuration."""

from dataclasses import dataclass
from pathlib import Path


DEFAULT_ORIGINS = (
    "http://localhost:3000", "http://127.0.0.1:3000",
    "http://localhost:5173", "http://127.0.0.1:5173",
    "http://localhost:8501", "http://127.0.0.1:8501",
)


@dataclass(frozen=True)
class WebApiSettings:
    root: Path = Path.cwd()
    max_upload_bytes: int = 4 * 1024 * 1024
    max_sensors_per_series: int = 8
    max_series_points: int = 1000
    allowed_origins: tuple[str, ...] = DEFAULT_ORIGINS

    def __post_init__(self) -> None:
        for name in (
            "max_upload_bytes",
            "max_sensors_per_series", "max_series_points",
        ):
            if getattr(self, name) < 1:
                raise ValueError(f"{name} must be positive.")
        if not self.allowed_origins or "*" in self.allowed_origins:
            raise ValueError("CORS origins must be explicit and cannot contain a wildcard.")
        if any(not origin.startswith(("http://localhost:", "http://127.0.0.1:")) for origin in self.allowed_origins):
            raise ValueError("Default API origins must be local development HTTP origins.")
