"""Validation-residual prediction ranges; never confidence guarantees."""


def validation_based_range(
    prediction: float,
    interval: dict[str, float | str] | None,
) -> tuple[float | None, float | None]:
    """Apply stored validation residual offsets while preserving a valid range."""

    interval = interval or {}
    lower_residual = interval.get("lower_residual_cycles")
    upper_residual = interval.get("upper_residual_cycles")
    if lower_residual is None or upper_residual is None:
        return None, None
    lower = max(0.0, prediction + float(lower_residual))
    upper = max(prediction, prediction + float(upper_residual))
    return min(lower, prediction), max(upper, prediction)
