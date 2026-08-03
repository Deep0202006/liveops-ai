"""Environment-configured ASGI entry point for Uvicorn."""

import os
from pathlib import Path

from ..schemas import ArtifactMode
from .application import create_api_app
from .settings import WebApiSettings

mode = ArtifactMode(os.environ.get("LIVEOPS_MODE", "demo").lower())
root = Path(os.environ.get("LIVEOPS_PROJECT_ROOT", Path.cwd())).resolve()
app = create_api_app(mode, WebApiSettings(root=root))
