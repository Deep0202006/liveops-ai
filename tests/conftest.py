import numpy as np
import pandas as pd
import pytest

from rul_predictor.artifacts import save_artifact
from rul_predictor.config import BackendConfig, TrainingConfig
from rul_predictor.schemas import ArtifactMode
from rul_predictor.config import DatasetSchema
from rul_predictor.training import train_and_select


@pytest.fixture(scope="session")
def schema() -> DatasetSchema:
    return DatasetSchema()


@pytest.fixture(scope="session")
def trajectories(schema: DatasetSchema) -> pd.DataFrame:
    rows = []
    for machine_id, lifetime in ((1, 6), (2, 7), (3, 8), (4, 9), (5, 10)):
        for cycle in range(1, lifetime + 1):
            row = {schema.machine_id: machine_id, schema.cycle: cycle}
            row.update({name: float(index) for index, name in enumerate(schema.operational_columns, 1)})
            row.update(
                {name: machine_id * 0.1 + cycle * index for index, name in enumerate(schema.sensor_columns, 1)}
            )
            rows.append(row)
    return pd.DataFrame(rows)


@pytest.fixture(scope="session")
def trained_backend(tmp_path_factory, trajectories, schema):
    artifact_directory = tmp_path_factory.mktemp("trusted-artifact")
    config = TrainingConfig(
        random_seed=9,
        validation_fraction=0.2,
        rul_cap=None,
        rolling_window=3,
        minimum_history=3,
        extra_trees_estimators=12,
        permutation_repeats=1,
    )
    result = train_and_select(trajectories, config=config, schema=schema)
    save_artifact(
        result,
        artifact_directory,
        dataset_name="synthetic-test-fixture",
        dataset_subset="SOFTWARE_TEST_ONLY",
        config=config,
        training_data_kind="synthetic",
        demo_only=True,
        metrics_publishable=False,
        scientific_validity="software-verification-only",
    )
    backend_config = BackendConfig(
        schema=schema,
        artifact_directory=artifact_directory,
        mode=ArtifactMode.DEMO,
    )
    return backend_config, result
