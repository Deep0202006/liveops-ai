import pandas as pd

from rul_predictor.config import TrainingConfig
from rul_predictor.features import build_causal_features, model_feature_names, prepare_feature_matrix


def test_rolling_features_use_only_current_and_past_rows(trajectories, schema):
    original = build_causal_features(trajectories, rolling_window=3, schema=schema)
    changed = trajectories.copy()
    changed.loc[(changed[schema.machine_id] == 1) & (changed[schema.cycle] == 6), "sensor_1"] = 99999
    modified = build_causal_features(changed, rolling_window=3, schema=schema)
    prior = (original[schema.machine_id] == 1) & (original[schema.cycle] < 6)
    pd.testing.assert_series_equal(
        original.loc[prior, "sensor_1_mean_3"].reset_index(drop=True),
        modified.loc[prior, "sensor_1_mean_3"].reset_index(drop=True),
    )


def test_machine_id_is_not_a_model_feature(schema):
    names = model_feature_names(schema, rolling_window=5)
    assert schema.machine_id not in names
    assert names == model_feature_names(schema, rolling_window=5)


def test_all_future_sensor_changes_leave_cycle_t_unchanged(trajectories, schema):
    cycle_t = 4
    original = build_causal_features(trajectories, rolling_window=3, schema=schema)
    changed = trajectories.copy()
    future = (changed[schema.machine_id] == 1) & (changed[schema.cycle] > cycle_t)
    changed.loc[future, list(schema.sensor_columns)] = 1_000_000
    modified = build_causal_features(changed, rolling_window=3, schema=schema)
    row = (original[schema.machine_id] == 1) & (original[schema.cycle] == cycle_t)
    columns = model_feature_names(schema, 3)
    pd.testing.assert_frame_equal(original.loc[row, columns], modified.loc[row, columns])


def test_training_and_inference_feature_matrix_parity(trajectories, schema):
    config = TrainingConfig(rolling_window=3, minimum_history=3)
    training_matrix = prepare_feature_matrix(trajectories, config=config, schema=schema)
    inference_matrix = prepare_feature_matrix(trajectories.copy(), config=config, schema=schema)
    assert list(training_matrix.columns) == model_feature_names(schema, 3)
    pd.testing.assert_frame_equal(training_matrix, inference_matrix)
