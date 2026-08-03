"""Authoritative schema and trajectory validation."""

import numpy as np
import pandas as pd

from .config import DatasetSchema
from .exceptions import (
    DataValidationError,
    InsufficientHistoryError,
    TrajectoryValidationError,
)
from .schemas import ValidationReport
from .schemas import ErrorCode


def validate_trajectory_frame(
    frame: pd.DataFrame,
    schema: DatasetSchema | None = None,
    *,
    minimum_history: int | None = None,
    require_single_machine: bool = False,
) -> pd.DataFrame:
    """Return a chronologically sorted copy or raise a clear validation error."""

    schema = schema or DatasetSchema()
    if schema.rul_unit != "cycles":
        raise DataValidationError(f"Unsupported RUL unit '{schema.rul_unit}'.")
    if not isinstance(frame, pd.DataFrame):
        raise DataValidationError("Trajectory input must be a pandas DataFrame.")
    missing = [column for column in schema.raw_columns if column not in frame.columns]
    if missing:
        if len(missing) == 1:
            raise DataValidationError(f"Required column '{missing[0]}' is missing.")
        raise DataValidationError(f"Required columns are missing: {', '.join(missing)}.")
    # A genuine target column is safe to ignore at prediction time; arbitrary extras are not.
    allowed_columns = {*schema.raw_columns, schema.target}
    unexpected = [column for column in frame.columns if column not in allowed_columns]
    if unexpected:
        raise DataValidationError(f"Unknown schema columns: {', '.join(map(str, unexpected))}.")
    if frame.empty:
        raise DataValidationError("The sensor dataset is empty.")

    result = frame.loc[:, schema.raw_columns].copy()
    for column in schema.raw_columns:
        result[column] = pd.to_numeric(result[column], errors="coerce")
        if result[column].isna().any():
            if column in schema.sensor_columns:
                raise DataValidationError(f"Sensor '{column}' contains non-numeric or missing values.")
            raise DataValidationError(f"Column '{column}' contains non-numeric or missing values.")
    if not np.isfinite(result.to_numpy(dtype=float)).all():
        raise DataValidationError("The sensor dataset contains infinite values.")

    if (result[schema.machine_id] <= 0).any():
        raise TrajectoryValidationError("Machine identifiers must be positive integers.")
    if (result[schema.cycle] <= 0).any():
        raise TrajectoryValidationError("Cycles must be positive integers.")
    machine_values = result[schema.machine_id].to_numpy(dtype=float)
    cycle_values = result[schema.cycle].to_numpy(dtype=float)
    if not np.equal(machine_values, np.floor(machine_values)).all():
        raise TrajectoryValidationError("Machine identifiers must be whole numbers.")
    if not np.equal(cycle_values, np.floor(cycle_values)).all():
        raise TrajectoryValidationError("Cycles must be whole numbers.")
    if result[[schema.machine_id, schema.cycle]].duplicated().any():
        duplicate = result.loc[
            result[[schema.machine_id, schema.cycle]].duplicated(keep=False),
            [schema.machine_id, schema.cycle],
        ].iloc[0]
        raise TrajectoryValidationError(
            f"Machine {int(duplicate[schema.machine_id])} contains duplicate cycle "
            f"{int(duplicate[schema.cycle])}.",
            code=ErrorCode.DUPLICATE_MACHINE_CYCLE,
        )

    result[schema.machine_id] = result[schema.machine_id].astype(int)
    result[schema.cycle] = result[schema.cycle].astype(int)
    result = result.sort_values([schema.machine_id, schema.cycle], kind="stable").reset_index(drop=True)
    machine_ids = result[schema.machine_id].unique()
    if require_single_machine and len(machine_ids) != 1:
        raise TrajectoryValidationError("Prediction input must contain exactly one machine history.")
    required = minimum_history if minimum_history is not None else 0
    if required > 0:
        short = result.groupby(schema.machine_id).size()
        short = short[short < required]
        if not short.empty:
            if require_single_machine:
                raise InsufficientHistoryError(f"At least {required} observations are required for prediction.")
            identifiers = ", ".join(str(int(value)) for value in short.index)
            raise InsufficientHistoryError(
                f"At least {required} observations are required per machine; short machines: {identifiers}."
            )
    return result


def assess_trajectory_frame(
    frame: pd.DataFrame,
    schema: DatasetSchema | None = None,
    *,
    minimum_history: int | None = None,
    require_single_machine: bool = False,
) -> tuple[pd.DataFrame, ValidationReport]:
    """Validate strictly and report safe-to-process quality warnings."""

    schema = schema or DatasetSchema()
    validated = validate_trajectory_frame(
        frame,
        schema,
        minimum_history=minimum_history,
        require_single_machine=require_single_machine,
    )
    warnings: list[str] = []
    constant_sensors = tuple(
        column for column in schema.sensor_columns if validated[column].nunique(dropna=False) <= 1
    )
    if constant_sensors:
        warnings.append(f"Constant sensor columns detected: {', '.join(constant_sensors)}.")
    missing_cycles: dict[int, tuple[int, ...]] = {}
    for machine_id, group in validated.groupby(schema.machine_id, sort=True):
        observed = set(int(value) for value in group[schema.cycle])
        expected = set(range(min(observed), max(observed) + 1))
        missing = tuple(sorted(expected - observed))
        if missing:
            missing_cycles[int(machine_id)] = missing
    if missing_cycles:
        warnings.append("One or more machine trajectories contain cycle gaps.")
    return validated, ValidationReport(
        valid=True,
        machine_count=int(validated[schema.machine_id].nunique()),
        observation_count=len(validated),
        warnings=tuple(warnings),
        constant_sensor_columns=constant_sensors,
        missing_cycles_by_machine=missing_cycles,
    )
