"""Defensible cycle-based Remaining Useful Life targets."""

import pandas as pd

from .config import DatasetSchema
from .validation import validate_trajectory_frame


def add_rul_target(
    frame: pd.DataFrame,
    *,
    cap: int | None = None,
    schema: DatasetSchema | None = None,
) -> pd.DataFrame:
    """Add RUL = final observed failure cycle - current cycle for run-to-failure data."""

    schema = schema or DatasetSchema()
    if cap is not None and cap < 0:
        raise ValueError("RUL cap must be non-negative.")
    result = validate_trajectory_frame(frame, schema)
    final_cycles = result.groupby(schema.machine_id)[schema.cycle].transform("max")
    result[schema.target] = (final_cycles - result[schema.cycle]).astype(float)
    if cap is not None:
        result[schema.target] = result[schema.target].clip(upper=cap)
    return result
