"""Deterministic, non-causal model and trajectory explanations."""

import numpy as np
import pandas as pd
from sklearn.inspection import permutation_importance
from sklearn.pipeline import Pipeline

from .config import DatasetSchema


def global_permutation_importance(
    pipeline: Pipeline,
    features: pd.DataFrame,
    target: pd.Series,
    *,
    random_seed: int,
    repeats: int = 3,
    top_n: int = 5,
) -> tuple[str, ...]:
    """Rank original input features by held-out permutation importance."""

    result = permutation_importance(
        pipeline,
        features,
        target,
        scoring="neg_mean_absolute_error",
        n_repeats=repeats,
        random_state=random_seed,
        n_jobs=1,
    )
    order = np.argsort(result.importances_mean)[::-1]
    return tuple(str(features.columns[index]) for index in order[:top_n])


def native_feature_importance(
    pipeline: Pipeline, feature_names: list[str]
) -> dict[str, float]:
    """Return tree-native importance as supporting, not causal, evidence."""

    model = pipeline.named_steps["model"]
    if not hasattr(model, "feature_importances_"):
        return {}
    selector = pipeline.named_steps.get("variance")
    selected_names = feature_names
    if selector is not None:
        selected_names = [
            name for name, keep in zip(feature_names, selector.get_support(), strict=True) if keep
        ]
    return {
        name: float(value)
        for name, value in sorted(
            zip(selected_names, model.feature_importances_, strict=True),
            key=lambda item: item[1],
            reverse=True,
        )
    }


def recent_sensor_changes(
    history: pd.DataFrame,
    schema: DatasetSchema,
    *,
    top_n: int = 3,
) -> tuple[str, ...]:
    """Describe largest latest sensor changes without claiming causation."""

    if len(history) < 2:
        return ()
    changes = (history.loc[:, schema.sensor_columns].iloc[-1] - history.loc[:, schema.sensor_columns].iloc[-2])
    ordered = changes.abs().sort_values(ascending=False).head(top_n).index
    return tuple(
        f"{name} changed by {changes[name]:+.3f} in the latest cycle." for name in ordered
    )
