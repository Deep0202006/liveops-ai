"""Lightweight, reproducible baseline comparison and model selection."""

from dataclasses import dataclass
from hashlib import sha256
from io import BytesIO
from time import perf_counter
from typing import Any

import numpy as np
import pandas as pd
import joblib
from sklearn.base import RegressorMixin
from sklearn.dummy import DummyRegressor
from sklearn.ensemble import ExtraTreesRegressor
from sklearn.impute import SimpleImputer
from sklearn.linear_model import Ridge
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.feature_selection import VarianceThreshold

from .config import DatasetSchema, TrainingConfig
from .evaluation import evaluate_predictions, regression_metrics
from .explainability import global_permutation_importance, native_feature_importance
from .features import build_causal_features, model_feature_names, prepare_feature_matrix
from .splitting import GroupSplit, split_by_machine
from .target import add_rul_target
from .schemas import EvaluationResult


@dataclass
class TrainingResult:
    pipeline: Pipeline
    selected_model: str
    validation_metrics: dict[str, dict[str, float]]
    validation_results: dict[str, EvaluationResult]
    split: GroupSplit
    feature_names: list[str]
    removed_features: list[str]
    training_ranges: dict[str, tuple[float, float]]
    prediction_interval: dict[str, float | str]
    important_features: tuple[str, ...]
    native_importance: dict[str, float]
    dataset_fingerprint: str
    selection_rule: str
    selection_reason: str
    training_seconds: float


def evaluate_official_test(
    pipeline: Pipeline,
    test_trajectories: pd.DataFrame,
    official_rul: pd.Series,
    feature_names: list[str],
    *,
    config: TrainingConfig | None = None,
    schema: DatasetSchema | None = None,
    model_name: str = "selected_model",
) -> tuple[EvaluationResult, pd.DataFrame]:
    """Evaluate once at each official truncated test trajectory's final cycle."""

    config = config or TrainingConfig()
    schema = schema or DatasetSchema()
    features = build_causal_features(
        test_trajectories, rolling_window=config.rolling_window, schema=schema
    )
    final_rows = features.groupby(schema.machine_id, sort=True).tail(1).reset_index(drop=True)
    if len(final_rows) != len(official_rul):
        raise ValueError("Official RUL label count must match the number of test machines.")
    predictions = np.maximum(0.0, pipeline.predict(final_rows[feature_names]))
    result, evidence = evaluate_predictions(
        model_name,
        final_rows[schema.machine_id],
        final_rows[schema.cycle],
        official_rul,
        predictions,
        near_failure_threshold=config.near_failure_threshold,
    )
    return result, evidence


def candidate_pipelines(
    random_seed: int,
    variance_threshold: float = 1e-12,
    extra_trees_estimators: int = 120,
) -> dict[str, Pipeline]:
    """Return a deliberately small model set including two baselines."""

    return {
        "dummy_median": Pipeline(
            [
                ("imputer", SimpleImputer(strategy="median")),
                ("variance", VarianceThreshold(threshold=variance_threshold)),
                ("model", DummyRegressor(strategy="median")),
            ]
        ),
        "ridge": Pipeline(
            [
                ("imputer", SimpleImputer(strategy="median")),
                ("variance", VarianceThreshold(threshold=variance_threshold)),
                ("scaler", StandardScaler()),
                ("model", Ridge(alpha=10.0)),
            ]
        ),
        "extra_trees": Pipeline(
            [
                ("imputer", SimpleImputer(strategy="median")),
                ("variance", VarianceThreshold(threshold=variance_threshold)),
                (
                    "model",
                    ExtraTreesRegressor(
                        n_estimators=extra_trees_estimators,
                        min_samples_leaf=2,
                        random_state=random_seed,
                        n_jobs=1,
                    ),
                ),
            ]
        ),
    }


def train_and_select(
    run_to_failure: pd.DataFrame,
    *,
    config: TrainingConfig | None = None,
    schema: DatasetSchema | None = None,
    dataset_subset: str = "FD001",
) -> TrainingResult:
    """Select on validation machines, then refit the winner on all training machines."""

    config = config or TrainingConfig()
    schema = schema or DatasetSchema()
    labeled = add_rul_target(run_to_failure, cap=config.rul_cap, schema=schema)
    split = split_by_machine(
        labeled,
        validation_fraction=config.validation_fraction,
        random_seed=config.random_seed,
        schema=schema,
    )
    feature_names = model_feature_names(schema, config.rolling_window)

    def matrix(partition: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
        target = partition[schema.target].reset_index(drop=True)
        features = prepare_feature_matrix(
            partition.drop(columns=[schema.target]), config=config, schema=schema
        )
        return features, target

    train_x, train_y = matrix(split.train)
    validation_x, validation_y = matrix(split.validation)
    models = candidate_pipelines(
        config.random_seed, config.variance_threshold, config.extra_trees_estimators
    )
    metrics: dict[str, dict[str, float]] = {}
    validation_results: dict[str, EvaluationResult] = {}
    fitted_candidates: dict[str, Pipeline] = {}
    candidate_sizes: dict[str, int] = {}
    start = perf_counter()
    for name, pipeline in models.items():
        pipeline.fit(train_x, train_y)
        prediction_start = perf_counter()
        predictions = np.maximum(0.0, pipeline.predict(validation_x))
        runtime = perf_counter() - prediction_start
        metrics[name] = regression_metrics(validation_y, predictions)
        evaluation, _ = evaluate_predictions(
            name,
            split.validation[schema.machine_id],
            split.validation[schema.cycle],
            validation_y,
            predictions,
            near_failure_threshold=config.near_failure_threshold,
            runtime_seconds=runtime,
        )
        validation_results[name] = evaluation
        fitted_candidates[name] = pipeline
        buffer = BytesIO()
        joblib.dump(pipeline, buffer)
        candidate_sizes[name] = buffer.tell()
        validation_results[name] = EvaluationResult(
            **{
                **evaluation.to_dict(),
                "artifact_size_bytes": candidate_sizes[name],
            }
        )
    sample_counts = {result.observation_count for result in validation_results.values()}
    if sample_counts != {len(validation_y)}:
        raise AssertionError("Candidate models were not evaluated on identical validation samples.")

    simplicity_rank = {"dummy_median": 0, "ridge": 1, "extra_trees": 2}

    def metric_key(name: str) -> tuple[float, float, float, float, str]:
        result = validation_results[name]
        return (
            result.mae,
            result.rmse,
            result.near_failure_mae if result.near_failure_mae is not None else float("inf"),
            result.machine_mae_std if result.machine_mae_std is not None else float("inf"),
            name,
        )

    dummy_mae = validation_results["dummy_median"].mae
    improved = [
        name
        for name in validation_results
        if name != "dummy_median"
        and validation_results[name].mae
        <= dummy_mae * (1 - config.dummy_min_relative_improvement)
    ]
    if not improved:
        selected_name = "dummy_median"
        selection_reason = "No candidate meaningfully outperformed the Dummy validation MAE."
    else:
        best_name = min(improved, key=metric_key)
        best = validation_results[best_name]
        similar = [
            name
            for name in improved
            if validation_results[name].mae
            <= best.mae * (1 + config.materially_similar_mae_fraction)
        ]

        def acceptable(name: str) -> bool:
            candidate = validation_results[name]
            secondary_limit = 1 + config.acceptable_secondary_degradation_fraction
            near_ok = (
                best.near_failure_mae is None
                or candidate.near_failure_mae is None
                or candidate.near_failure_mae <= best.near_failure_mae * secondary_limit
            )
            stability_ok = (
                best.machine_mae_std is None
                or candidate.machine_mae_std is None
                or candidate.machine_mae_std <= max(best.machine_mae_std * secondary_limit, 1e-12)
            )
            return near_ok and stability_ok

        acceptable_similar = [name for name in similar if acceptable(name)] or [best_name]
        selected_name = min(
            acceptable_similar,
            key=lambda name: (
                simplicity_rank[name],
                candidate_sizes[name],
                validation_results[name].runtime_seconds or float("inf"),
                *metric_key(name),
            ),
        )
        selection_reason = (
            f"Selected {selected_name}: it meaningfully beat Dummy and was the simplest acceptable "
            "model within 5% of best validation MAE without materially worse near-failure error or stability."
        )
    selection_rule = (
        "Require >=1% validation MAE improvement over Dummy; among models within 5% of best MAE, "
        "exclude materially worse near-failure/stability results and prefer simpler, smaller, faster models."
    )
    selected_validation_pipeline = fitted_candidates[selected_name]
    validation_predictions = np.maximum(0.0, selected_validation_pipeline.predict(validation_x))
    residuals = validation_y.to_numpy(dtype=float) - validation_predictions
    prediction_interval: dict[str, float | str] = {
        "method": "validation residual quantiles",
        "lower_quantile": config.validation_residual_lower_quantile,
        "upper_quantile": config.validation_residual_upper_quantile,
        "lower_residual_cycles": min(
            0.0, float(np.quantile(residuals, config.validation_residual_lower_quantile))
        ),
        "upper_residual_cycles": max(
            0.0, float(np.quantile(residuals, config.validation_residual_upper_quantile))
        ),
    }
    important_features = global_permutation_importance(
        selected_validation_pipeline,
        validation_x,
        validation_y,
        random_seed=config.random_seed,
        repeats=config.permutation_repeats,
    )

    all_features = prepare_feature_matrix(
        labeled.drop(columns=[schema.target]), config=config, schema=schema
    )
    selected = candidate_pipelines(
        config.random_seed, config.variance_threshold, config.extra_trees_estimators
    )[selected_name]
    selected.fit(all_features, labeled[schema.target])
    selector = selected.named_steps["variance"]
    removed_features = [
        name for name, keep in zip(feature_names, selector.get_support(), strict=True) if not keep
    ]
    training_ranges = {
        name: (float(all_features[name].min()), float(all_features[name].max()))
        for name in feature_names
    }
    fingerprint_data = pd.util.hash_pandas_object(
        labeled.loc[:, [*schema.raw_columns, schema.target]], index=False
    ).values.tobytes()
    fingerprint_context = (
        dataset_subset
        + "|"
        + str(len(labeled))
        + "|"
        + "|".join(schema.raw_columns)
    ).encode("utf-8")
    return TrainingResult(
        pipeline=selected,
        selected_model=selected_name,
        validation_metrics=metrics,
        validation_results=validation_results,
        split=split,
        feature_names=feature_names,
        removed_features=removed_features,
        training_ranges=training_ranges,
        prediction_interval=prediction_interval,
        important_features=important_features,
        native_importance=native_feature_importance(selected, feature_names),
        dataset_fingerprint=sha256(fingerprint_context + fingerprint_data).hexdigest(),
        selection_rule=selection_rule,
        selection_reason=selection_reason,
        training_seconds=perf_counter() - start,
    )
