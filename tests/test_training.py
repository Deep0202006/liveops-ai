from rul_predictor.config import TrainingConfig
from rul_predictor.training import train_and_select


def test_candidates_use_same_samples_and_selection_is_deterministic(trajectories, schema):
    config = TrainingConfig(
        random_seed=23,
        rolling_window=3,
        minimum_history=3,
        extra_trees_estimators=10,
        permutation_repeats=1,
    )
    first = train_and_select(trajectories, config=config, schema=schema)
    second = train_and_select(trajectories, config=config, schema=schema)
    assert first.selected_model == second.selected_model
    counts = {result.observation_count for result in first.validation_results.values()}
    assert counts == {len(first.split.validation)}
    for name in first.validation_results:
        assert first.validation_results[name].mae == second.validation_results[name].mae
        assert first.validation_results[name].rmse == second.validation_results[name].rmse
    assert first.dataset_fingerprint == second.dataset_fingerprint
    assert first.prediction_interval == second.prediction_interval
    assert first.removed_features
