"""Honest regression metrics with explicit cycle units."""

from typing import Any

import numpy as np
import pandas as pd
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    median_absolute_error,
    r2_score,
)

from .schemas import EvaluationResult


def regression_metrics(actual: pd.Series | np.ndarray, predicted: np.ndarray) -> dict[str, float]:
    """Compute documented held-out regression metrics."""

    y_true = np.asarray(actual, dtype=float)
    y_pred = np.asarray(predicted, dtype=float)
    if y_true.shape != y_pred.shape or y_true.size == 0:
        raise ValueError("Actual and predicted values must have the same non-empty shape.")
    return {
        "mae_cycles": float(mean_absolute_error(y_true, y_pred)),
        "rmse_cycles": float(np.sqrt(mean_squared_error(y_true, y_pred))),
        "median_absolute_error_cycles": float(median_absolute_error(y_true, y_pred)),
        "r2": float(r2_score(y_true, y_pred)) if y_true.size > 1 else float("nan"),
    }


def evaluation_frame(
    machine_ids: pd.Series,
    cycles: pd.Series,
    actual: pd.Series,
    predicted: np.ndarray,
) -> pd.DataFrame:
    """Create row-level evidence for plots and grouped reports."""

    result = pd.DataFrame(
        {
            "machine_id": machine_ids.to_numpy(),
            "cycle": cycles.to_numpy(),
            "actual_rul": np.asarray(actual, dtype=float),
            "predicted_rul": np.asarray(predicted, dtype=float),
        }
    )
    result["residual"] = result["actual_rul"] - result["predicted_rul"]
    result["absolute_error"] = result["residual"].abs()
    result["rul_band"] = pd.cut(
        result["actual_rul"], [-1, 25, 75, float("inf")], labels=["0-25", "26-75", "76+"]
    )
    return result


def grouped_error_report(frame: pd.DataFrame) -> dict[str, Any]:
    """Summarize absolute error by machine and RUL band."""

    return {
        "by_machine": frame.groupby("machine_id")["absolute_error"].mean().to_dict(),
        "by_rul_band": frame.groupby("rul_band", observed=True)["absolute_error"].mean().to_dict(),
        "evaluated_machines": int(frame["machine_id"].nunique()),
    }


def evaluate_predictions(
    model_name: str,
    machine_ids: pd.Series,
    cycles: pd.Series,
    actual: pd.Series,
    predicted: np.ndarray,
    *,
    near_failure_threshold: int = 25,
    runtime_seconds: float | None = None,
) -> tuple[EvaluationResult, pd.DataFrame]:
    """Evaluate one model on a fixed sample and return typed evidence."""

    evidence = evaluation_frame(machine_ids, cycles, actual, predicted)
    metrics = regression_metrics(actual, predicted)
    near = evidence[evidence["actual_rul"] <= near_failure_threshold]
    machine_mae = evidence.groupby("machine_id")["absolute_error"].mean()
    band_errors = {
        str(key): float(value)
        for key, value in evidence.groupby("rul_band", observed=True)["absolute_error"].mean().items()
    }
    result = EvaluationResult(
        model_name=model_name,
        mae=metrics["mae_cycles"],
        rmse=metrics["rmse_cycles"],
        median_absolute_error=metrics["median_absolute_error_cycles"],
        r2=metrics["r2"],
        machine_count=int(evidence["machine_id"].nunique()),
        observation_count=len(evidence),
        near_failure_mae=float(near["absolute_error"].mean()) if not near.empty else None,
        machine_mae_std=float(machine_mae.std(ddof=0)) if len(machine_mae) else None,
        error_by_rul_band=band_errors,
        runtime_seconds=runtime_seconds,
    )
    return result, evidence
