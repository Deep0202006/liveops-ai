"""Machine-disjoint train/validation splitting."""

from dataclasses import dataclass

import numpy as np
import pandas as pd

from .config import DatasetSchema
from .exceptions import DataValidationError


@dataclass(frozen=True)
class GroupSplit:
    train: pd.DataFrame
    validation: pd.DataFrame
    train_machine_ids: tuple[int, ...]
    validation_machine_ids: tuple[int, ...]


def assert_disjoint_machine_groups(
    train_ids: set[int | str],
    validation_ids: set[int | str],
    test_ids: set[int | str],
) -> None:
    """Fail closed when any custom-dataset machine crosses an experimental group."""

    assert train_ids.isdisjoint(validation_ids), "Train and validation machines overlap."
    assert train_ids.isdisjoint(test_ids), "Train and test machines overlap."
    assert validation_ids.isdisjoint(test_ids), "Validation and test machines overlap."


def split_by_machine(
    frame: pd.DataFrame,
    *,
    validation_fraction: float = 0.2,
    random_seed: int = 42,
    schema: DatasetSchema | None = None,
) -> GroupSplit:
    """Split whole machines deterministically; never split trajectory rows."""

    schema = schema or DatasetSchema()
    if not 0 < validation_fraction < 1:
        raise ValueError("validation_fraction must be between 0 and 1.")
    machine_ids = np.array(sorted(frame[schema.machine_id].unique()), dtype=int)
    if len(machine_ids) < 2:
        raise DataValidationError("At least two machines are required for a machine-level split.")
    rng = np.random.default_rng(random_seed)
    shuffled = rng.permutation(machine_ids)
    validation_count = max(1, min(len(machine_ids) - 1, round(len(machine_ids) * validation_fraction)))
    validation_ids = tuple(sorted(int(value) for value in shuffled[:validation_count]))
    train_ids = tuple(sorted(int(value) for value in shuffled[validation_count:]))

    assert_disjoint_machine_groups(set(train_ids), set(validation_ids), set())
    train = frame[frame[schema.machine_id].isin(train_ids)].copy().reset_index(drop=True)
    validation = frame[frame[schema.machine_id].isin(validation_ids)].copy().reset_index(drop=True)
    if train.empty or validation.empty:
        raise DataValidationError("Machine-level split produced an empty partition.")
    return GroupSplit(train, validation, train_ids, validation_ids)
