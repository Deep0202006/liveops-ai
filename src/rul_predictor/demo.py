"""Deterministic synthetic software-integration data and artifact workflow."""

from dataclasses import dataclass
from pathlib import Path
from time import perf_counter

import numpy as np
import pandas as pd

from .artifacts import load_artifact, save_artifact
from .config import BackendConfig, DatasetSchema, MaintenanceConfig, TrainingConfig
from .schemas import ArtifactMode, PredictionRequest
from .serialization import SerializableContract
from .service import RULService
from .features import prepare_feature_matrix
from .maintenance import maintenance_status
from .training import train_and_select


DEMO_SEED = 20260802


@dataclass(frozen=True)
class DemoBuildResult(SerializableContract):
    artifact_directory: str
    sample_directory: str
    training_seconds: float
    artifact_size_bytes: int
    selected_model: str
    sample_statuses: dict[str, str]
    demo_only: bool = True
    metrics_publishable: bool = False


def generate_synthetic_trajectories(
    *,
    machine_count: int = 12,
    seed: int = DEMO_SEED,
    schema: DatasetSchema | None = None,
    first_machine_id: int = 1,
) -> pd.DataFrame:
    """Generate small degradation-shaped trajectories for software integration only."""

    schema = schema or DatasetSchema()
    rng = np.random.default_rng(seed)
    rows: list[dict[str, float | int]] = []
    for offset in range(machine_count):
        machine_id = first_machine_id + offset
        lifetime = 85 + (offset * 7) % 46
        machine_shift = rng.normal(0, 0.8)
        for cycle in range(1, lifetime + 1):
            progress = cycle / lifetime
            row: dict[str, float | int] = {
                schema.machine_id: machine_id,
                schema.cycle: cycle,
                schema.operational_columns[0]: round(float(np.sin(cycle / 13) * 0.2), 5),
                schema.operational_columns[1]: round(float(np.cos(cycle / 17) * 0.1), 5),
                schema.operational_columns[2]: float(offset % 3),
            }
            for index, sensor in enumerate(schema.sensor_columns, start=1):
                direction = 1.0 if index % 3 else -1.0
                degradation = direction * (4 + index * 0.35) * progress**1.7
                seasonal = np.sin(cycle / (5 + index % 4)) * 0.15
                noise = rng.normal(0, 0.04 + index * 0.002)
                row[sensor] = round(
                    float(100 + index * 3 + machine_shift + degradation + seasonal + noise), 6
                )
            rows.append(row)
    return pd.DataFrame(rows)


def demo_training_config() -> TrainingConfig:
    return TrainingConfig(
        random_seed=42,
        validation_fraction=0.25,
        rul_cap=125,
        rolling_window=5,
        minimum_history=5,
        extra_trees_estimators=48,
        permutation_repeats=1,
    )


def build_demo_artifact(
    artifact_directory: Path = Path("artifacts/demo"),
    sample_directory: Path = Path("data/sample"),
) -> DemoBuildResult:
    """Build only an explicit demo artifact and model-derived frontend samples."""

    if artifact_directory.resolve() == Path("artifacts/real").resolve():
        raise ValueError("Demo artifacts cannot be written to the real artifact directory.")
    schema = DatasetSchema()
    config = demo_training_config()
    trajectories = generate_synthetic_trajectories(schema=schema)
    start = perf_counter()
    result = train_and_select(
        trajectories,
        config=config,
        schema=schema,
        dataset_subset="DEMO_V1",
    )
    save_artifact(
        result,
        artifact_directory,
        dataset_name="LiveOps deterministic synthetic integration data",
        dataset_subset="DEMO_V1",
        config=config,
        training_data_kind="synthetic",
        demo_only=True,
        metrics_publishable=False,
        scientific_validity="software-verification-only",
        maintenance=MaintenanceConfig(),
    )
    training_seconds = perf_counter() - start
    service = RULService(
        BackendConfig(
            schema=schema,
            artifact_directory=artifact_directory,
            mode=ArtifactMode.DEMO,
            dataset_name="LiveOps deterministic synthetic integration data",
            dataset_subset="DEMO_V1",
        )
    )
    candidate = generate_synthetic_trajectories(
        machine_count=1,
        seed=DEMO_SEED + 1,
        schema=schema,
        first_machine_id=9001,
    )
    targets = {
        "demo_machine_healthy.csv": "HEALTHY",
        "demo_machine_monitor.csv": "MONITOR",
        "demo_machine_critical.csv": "CRITICAL",
    }
    pipeline, _, _ = load_artifact(artifact_directory, expected_mode=ArtifactMode.DEMO)
    matrix = prepare_feature_matrix(candidate, config=config, schema=schema)
    candidate_predictions = np.maximum(0.0, pipeline.predict(matrix))
    candidate_statuses = [maintenance_status(value, MaintenanceConfig()) for value in candidate_predictions]
    selected_histories: dict[str, pd.DataFrame] = {}
    observed_statuses: dict[str, str] = {}
    for end_cycle in range(config.minimum_history, int(candidate[schema.cycle].max()) + 1):
        history = candidate[candidate[schema.cycle] <= end_cycle]
        status = candidate_statuses[end_cycle - 1]
        for filename, desired_status in targets.items():
            if desired_status == status and filename not in selected_histories:
                selected_histories[filename] = history.copy()
                observed_statuses[filename] = service.predict(
                    PredictionRequest(9001, history)
                ).maintenance_status
    missing = sorted(set(targets) - set(selected_histories))
    if missing:
        raise RuntimeError(f"Demo model did not produce required sample statuses: {', '.join(missing)}")
    sample_directory.mkdir(parents=True, exist_ok=True)
    for filename, history in selected_histories.items():
        history.to_csv(sample_directory / filename, index=False)
    return DemoBuildResult(
        artifact_directory=str(artifact_directory),
        sample_directory=str(sample_directory),
        training_seconds=training_seconds,
        artifact_size_bytes=sum(path.stat().st_size for path in artifact_directory.iterdir()),
        selected_model=result.selected_model,
        sample_statuses=observed_statuses,
    )
