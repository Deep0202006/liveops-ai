"""Documented fixed FD001 selection; deliberately independent of prediction error."""

from .contracts import SCENARIOS


def source_machine_ids(scenario_id: str) -> tuple[int, ...]:
    definition = SCENARIOS[scenario_id]
    return tuple(definition["machine_ids"])


def display_asset_id(index: int) -> str:
    return f"RT-{index + 1:02d}"
