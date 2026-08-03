"""Central, immutable configuration for the RUL backend."""

from dataclasses import dataclass, field
from pathlib import Path

from .schemas import ArtifactMode


@dataclass(frozen=True)
class DatasetSchema:
    """NASA C-MAPSS FD001 column contract."""

    machine_id: str = "machine_id"
    cycle: str = "cycle"
    operational_columns: tuple[str, ...] = (
        "operational_setting_1",
        "operational_setting_2",
        "operational_setting_3",
    )
    sensor_columns: tuple[str, ...] = tuple(f"sensor_{index}" for index in range(1, 22))
    target: str = "rul"
    rul_unit: str = "cycles"
    minimum_trajectory_length: int = 5
    missing_value_policy: str = "reject"
    duplicate_policy: str = "reject"

    def __post_init__(self) -> None:
        if self.rul_unit != "cycles":
            raise ValueError("Only cycle-based RUL is supported.")
        if self.minimum_trajectory_length < 2:
            raise ValueError("minimum_trajectory_length must be at least 2.")
        if self.missing_value_policy != "reject" or self.duplicate_policy != "reject":
            raise ValueError("Only reject policies are supported for missing and duplicate values.")

    @property
    def raw_columns(self) -> tuple[str, ...]:
        return (self.machine_id, self.cycle, *self.operational_columns, *self.sensor_columns)


@dataclass(frozen=True)
class TrainingConfig:
    """Reproducible experimental choices."""

    random_seed: int = 42
    validation_fraction: float = 0.2
    rul_cap: int | None = 125
    rolling_window: int = 5
    minimum_history: int = 5
    validation_residual_lower_quantile: float = 0.1
    validation_residual_upper_quantile: float = 0.9
    near_failure_threshold: int = 25
    variance_threshold: float = 1e-12
    rul_bands: tuple[int, ...] = (25, 75)
    extra_trees_estimators: int = 40
    permutation_repeats: int = 3
    dummy_min_relative_improvement: float = 0.01
    materially_similar_mae_fraction: float = 0.05
    acceptable_secondary_degradation_fraction: float = 0.10

    def __post_init__(self) -> None:
        if self.rolling_window < 2:
            raise ValueError("rolling_window must be at least 2.")
        if self.minimum_history < self.rolling_window:
            raise ValueError("minimum_history must be at least the rolling_window.")
        if not 0 < self.validation_fraction < 1:
            raise ValueError("validation_fraction must be between 0 and 1.")
        if not 0 <= self.validation_residual_lower_quantile < self.validation_residual_upper_quantile <= 1:
            raise ValueError("Validation residual quantiles must be ordered within [0, 1].")
        if self.extra_trees_estimators < 1 or self.permutation_repeats < 1:
            raise ValueError("Model and importance repeat counts must be positive.")
        for value in (
            self.dummy_min_relative_improvement,
            self.materially_similar_mae_fraction,
            self.acceptable_secondary_degradation_fraction,
        ):
            if not 0 <= value < 1:
                raise ValueError("Model selection fractions must be within [0, 1).")


@dataclass(frozen=True)
class MaintenanceConfig:
    """Transparent presentation thresholds in RUL cycles."""

    urgent_at_or_below: float = 25.0
    plan_at_or_below: float = 50.0
    monitor_at_or_below: float = 80.0

    def __post_init__(self) -> None:
        if min(self.urgent_at_or_below, self.plan_at_or_below, self.monitor_at_or_below) < 0:
            raise ValueError("Maintenance thresholds must be non-negative cycles.")
        if not self.urgent_at_or_below < self.plan_at_or_below < self.monitor_at_or_below:
            raise ValueError("Maintenance thresholds must be strictly ordered: critical < plan < monitor.")


@dataclass(frozen=True)
class BackendConfig:
    """Single configuration root used by scripts, services, training, and inference."""

    schema: DatasetSchema = field(default_factory=DatasetSchema)
    training: TrainingConfig = field(default_factory=TrainingConfig)
    maintenance: MaintenanceConfig = field(default_factory=MaintenanceConfig)
    data_directory: Path = Path("data/raw")
    artifact_directory: Path = Path("artifacts/real")
    mode: ArtifactMode = ArtifactMode.REAL
    dataset_name: str = "NASA C-MAPSS"
    dataset_subset: str = "FD001"

    @property
    def train_path(self) -> Path:
        return self.data_directory / f"train_{self.dataset_subset}.txt"

    @property
    def test_path(self) -> Path:
        return self.data_directory / f"test_{self.dataset_subset}.txt"

    @property
    def truth_path(self) -> Path:
        return self.data_directory / f"RUL_{self.dataset_subset}.txt"


DEFAULT_CONFIG = BackendConfig()
