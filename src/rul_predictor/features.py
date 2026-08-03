"""Causal feature engineering shared by training and inference."""

import pandas as pd

from .config import DatasetSchema, TrainingConfig
from .validation import validate_trajectory_frame


def build_causal_features(
    frame: pd.DataFrame,
    *,
    rolling_window: int = 5,
    schema: DatasetSchema | None = None,
) -> pd.DataFrame:
    """Build current and trailing-only rolling features, grouped by machine."""

    if rolling_window < 2:
        raise ValueError("rolling_window must be at least 2.")
    schema = schema or DatasetSchema()
    result = validate_trajectory_frame(frame, schema)
    feature_columns = (*schema.operational_columns, *schema.sensor_columns)
    groups = result.groupby(schema.machine_id, sort=False)
    for column in feature_columns:
        rolling = groups[column].rolling(rolling_window, min_periods=1)
        result[f"{column}_mean_{rolling_window}"] = rolling.mean().reset_index(level=0, drop=True)
        result[f"{column}_std_{rolling_window}"] = (
            rolling.std(ddof=0).reset_index(level=0, drop=True).fillna(0.0)
        )
        result[f"{column}_delta"] = groups[column].diff().fillna(0.0)
    return result


def model_feature_names(schema: DatasetSchema | None = None, rolling_window: int = 5) -> list[str]:
    """Return stable, explicit model input order; machine ID is intentionally excluded."""

    schema = schema or DatasetSchema()
    base = [schema.cycle, *schema.operational_columns, *schema.sensor_columns]
    engineered: list[str] = []
    for column in (*schema.operational_columns, *schema.sensor_columns):
        engineered.extend(
            [f"{column}_mean_{rolling_window}", f"{column}_std_{rolling_window}", f"{column}_delta"]
        )
    return [*base, *engineered]


def prepare_feature_matrix(
    frame: pd.DataFrame,
    *,
    config: TrainingConfig,
    schema: DatasetSchema,
) -> pd.DataFrame:
    """Return the authoritative, deterministic model matrix used by every caller."""

    featured = build_causal_features(
        frame,
        rolling_window=config.rolling_window,
        schema=schema,
    )
    return featured[model_feature_names(schema, config.rolling_window)]
