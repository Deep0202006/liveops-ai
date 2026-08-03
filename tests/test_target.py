from rul_predictor.target import add_rul_target


def test_rul_is_cycles_until_each_machine_final_cycle(trajectories, schema):
    labeled = add_rul_target(trajectories, schema=schema)
    assert labeled.groupby(schema.machine_id)[schema.target].last().eq(0).all()
    first = labeled.groupby(schema.machine_id)[schema.target].first().to_dict()
    assert first == {1: 5.0, 2: 6.0, 3: 7.0, 4: 8.0, 5: 9.0}
    assert (labeled[schema.target] >= 0).all()


def test_rul_cap_is_explicit(trajectories, schema):
    labeled = add_rul_target(trajectories, cap=3, schema=schema)
    assert labeled[schema.target].max() == 3
