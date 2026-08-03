# Data Contract

The authoritative schema is `DatasetSchema`. FD001 trajectory input has exactly 26 named numeric columns: `machine_id`, `cycle`, three operational settings, and `sensor_1` through `sensor_21`. RUL unit is `cycles`.

Strict errors reject empty frames, missing/unknown columns, missing/non-numeric/infinite values, non-positive or fractional IDs/cycles, duplicate machine-cycle pairs, multiple machines for one prediction, and insufficient inference history. Expected failures use `DataValidationError`, `TrajectoryValidationError`, or `InsufficientHistoryError`.

Safe warnings do not mutate input:

- cycle gaps;
- constant sensor channels;
- latest engineered values outside training ranges.

Input is copied and sorted by machine/cycle. Duplicate and missing-value policies are `reject`. The default minimum trajectory length is five observations. A prediction request's `machine_id` must match the single trajectory machine.

Target convention for run-to-failure training data:

\[
RUL_{m,c} = \max(cycle_m) - c
\]

The failure row is 0 cycles, never 1. Optional cap 125 is applied after the subtraction. Official test truth is never passed to target generation or training.
