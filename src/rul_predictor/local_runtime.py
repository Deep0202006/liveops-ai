"""Small local-runtime helpers shared by launch and smoke verification."""

import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path
import socket

from .config import BackendConfig
from .schemas import ArtifactMode
from .service import RULService


def configure_local_logging(root: Path) -> logging.Logger:
    """Create a modest rotating local log without recording trajectory content."""

    logger = logging.getLogger("liveops.local")
    if logger.handlers:
        return logger
    directory = root / "runtime" / "logs"
    directory.mkdir(parents=True, exist_ok=True)
    handler = RotatingFileHandler(
        directory / "liveops.log", maxBytes=512_000, backupCount=2, encoding="utf-8"
    )
    handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s"))
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)
    return logger


def port_is_available(host: str, port: int) -> bool:
    if not 1 <= port <= 65535:
        return False
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as listener:
        try:
            listener.bind((host, port))
        except OSError:
            return False
    return True


def configured_service(root: Path, mode: ArtifactMode) -> RULService:
    return RULService(
        BackendConfig(artifact_directory=root / "artifacts" / mode.value, mode=mode)
    )
