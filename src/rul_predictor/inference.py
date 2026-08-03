"""Schema-checked RUL inference using the training feature implementation."""

from pathlib import Path

import numpy as np
import pandas as pd

from dataclasses import asdict

from .config import BackendConfig, DatasetSchema
from .schemas import PredictionRequest
from .service import RULService


def predict_latest(
    history: pd.DataFrame,
    artifact_directory: Path,
    *,
    schema: DatasetSchema | None = None,
) -> dict[str, object]:
    """Predict the latest row for exactly one machine history."""

    schema = schema or DatasetSchema()
    if history.empty or schema.machine_id not in history:
        machine_id: int | str = "unknown"
    else:
        machine_id = history[schema.machine_id].iloc[0]
    service = RULService(
        BackendConfig(schema=schema, artifact_directory=artifact_directory)
    )
    result = service.predict(PredictionRequest(machine_id=machine_id, trajectory=history))
    payload = asdict(result)
    payload["cycle"] = payload.pop("observed_through_cycle")
    payload["uncertainty_notice"] = (
        "Estimated validation-residual range; not a guarantee."
        if result.lower_bound is not None
        else "No calibrated prediction interval is available."
    )
    return payload
