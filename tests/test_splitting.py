import pytest

from rul_predictor.splitting import assert_disjoint_machine_groups, split_by_machine


def test_split_is_machine_disjoint_and_reproducible(trajectories, schema):
    first = split_by_machine(trajectories, random_seed=17, schema=schema)
    second = split_by_machine(trajectories, random_seed=17, schema=schema)
    assert first.train_machine_ids == second.train_machine_ids
    assert first.validation_machine_ids == second.validation_machine_ids
    assert set(first.train_machine_ids).isdisjoint(first.validation_machine_ids)
    assert not first.train.empty and not first.validation.empty


def test_three_way_overlap_assertions_fail_closed():
    assert_disjoint_machine_groups({1, 2}, {3}, {4})
    with pytest.raises(AssertionError, match="Train and test"):
        assert_disjoint_machine_groups({1, 2}, {3}, {2, 4})
