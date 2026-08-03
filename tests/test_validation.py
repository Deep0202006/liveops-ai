import numpy as np
import pandas as pd
import pytest

from rul_predictor.exceptions import DataValidationError
from rul_predictor.validation import assess_trajectory_frame, validate_trajectory_frame


def test_safe_target_column_is_accepted_and_removed(trajectories, schema):
    validated = validate_trajectory_frame(trajectories.assign(rul=10), schema)
    assert schema.target not in validated.columns


def test_sorts_chronologically(trajectories, schema):
    shuffled = trajectories.sample(frac=1, random_state=2)
    result = validate_trajectory_frame(shuffled, schema)
    assert result[[schema.machine_id, schema.cycle]].equals(
        result[[schema.machine_id, schema.cycle]].sort_values([schema.machine_id, schema.cycle]).reset_index(drop=True)
    )


def test_duplicate_cycle_has_clear_error(trajectories, schema):
    duplicated = pd.concat([trajectories, trajectories.iloc[[0]]], ignore_index=True)
    with pytest.raises(DataValidationError, match="Machine 1 contains duplicate cycle 1"):
        validate_trajectory_frame(duplicated, schema)


def test_non_numeric_and_infinite_values_are_rejected(trajectories, schema):
    invalid = trajectories.copy()
    invalid["sensor_5"] = invalid["sensor_5"].astype(object)
    invalid.loc[0, "sensor_5"] = "broken"
    with pytest.raises(DataValidationError, match="sensor_5.*non-numeric"):
        validate_trajectory_frame(invalid, schema)
    infinite = trajectories.copy()
    infinite.loc[0, "sensor_5"] = np.inf
    with pytest.raises(DataValidationError, match="infinite"):
        validate_trajectory_frame(infinite, schema)


def test_missing_empty_unknown_and_invalid_cycles_are_rejected(trajectories, schema):
    with pytest.raises(DataValidationError, match="Required column 'cycle' is missing"):
        validate_trajectory_frame(trajectories.drop(columns=[schema.cycle]), schema)
    with pytest.raises(DataValidationError, match="empty"):
        validate_trajectory_frame(trajectories.iloc[0:0], schema)
    with pytest.raises(DataValidationError, match="Unknown schema columns: surprise"):
        validate_trajectory_frame(trajectories.assign(surprise=1), schema)
    invalid = trajectories.copy()
    invalid.loc[0, schema.cycle] = 0
    with pytest.raises(DataValidationError, match="positive integers"):
        validate_trajectory_frame(invalid, schema)
    fractional = trajectories.copy()
    fractional[schema.cycle] = fractional[schema.cycle].astype(float)
    fractional.loc[0, schema.cycle] = 1.5
    with pytest.raises(DataValidationError, match="whole numbers"):
        validate_trajectory_frame(fractional, schema)


def test_report_warns_for_constant_sensors_and_cycle_gaps(trajectories, schema):
    altered = trajectories[~((trajectories[schema.machine_id] == 1) & (trajectories[schema.cycle] == 3))].copy()
    altered["sensor_8"] = 1.0
    _, report = assess_trajectory_frame(altered, schema)
    assert "sensor_8" in report.constant_sensor_columns
    assert report.missing_cycles_by_machine[1] == (3,)
    assert len(report.warnings) == 2
