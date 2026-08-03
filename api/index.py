"""Vercel Python entry point with import-safe application construction."""

import os
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

from rul_predictor.api import WebApiSettings, create_api_app
from rul_predictor.schemas import ArtifactMode

mode = ArtifactMode(os.environ.get("LIVEOPS_MODE", "demo").strip().lower())
app = create_api_app(mode, WebApiSettings(root=ROOT))
