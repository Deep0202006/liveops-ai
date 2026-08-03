"""Load official-format NASA C-MAPSS text files."""

from pathlib import Path

import pandas as pd

from .config import DatasetSchema
from .exceptions import DataValidationError
from .validation import validate_trajectory_frame


def load_cmapss_trajectory(path: Path, schema: DatasetSchema | None = None) -> pd.DataFrame:
    """Load a whitespace-delimited C-MAPSS train or test trajectory file."""

    schema = schema or DatasetSchema()
    if not path.is_file():
        raise DataValidationError(f"Dataset file does not exist: {path}")
    try:
        frame = pd.read_csv(path, sep=r"\s+", header=None)
    except (OSError, pd.errors.ParserError) as exc:
        raise DataValidationError(f"Unable to read dataset file: {path.name}") from exc
    if frame.shape[1] != len(schema.raw_columns):
        raise DataValidationError(
            f"Unknown dataset schema: expected {len(schema.raw_columns)} columns, "
            f"found {frame.shape[1]}."
        )
    frame.columns = list(schema.raw_columns)
    return validate_trajectory_frame(frame, schema)


def load_official_rul(path: Path) -> pd.Series:
    """Load one official RUL offset per truncated test machine."""

    if not path.is_file():
        raise DataValidationError(f"RUL label file does not exist: {path}")
    try:
        frame = pd.read_csv(path, sep=r"\s+", header=None)
    except (OSError, pd.errors.ParserError) as exc:
        raise DataValidationError(f"Unable to read RUL label file: {path.name}") from exc
    values = pd.to_numeric(frame.iloc[:, 0], errors="coerce")
    if values.isna().any() or (values < 0).any():
        raise DataValidationError("Official RUL labels must be finite, numeric, and non-negative.")
    return values.astype(float).reset_index(drop=True)
