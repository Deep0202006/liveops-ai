# Training Methodology

1. Validate official `train_FD001.txt`.
2. Generate `max_cycle - cycle`, capped at 125 by default.
3. Split entire training machines deterministically with seed 42.
4. Build current values plus trailing five-cycle mean, population standard deviation, and previous-cycle delta. Features are grouped/sorted and never centered.
5. Fit median imputation and `VarianceThreshold` only inside each training pipeline. Ridge also fits scaling inside its pipeline.
6. Compare median Dummy, Ridge, and Extra Trees on identical validation rows.
7. Select deterministically by validation MAE, then RMSE, near-failure MAE (≤25 cycles), per-machine MAE stability, then stable model name. Runtime is recorded for review but excluded from automatic tie-breaking to preserve reproducibility.
8. Compute permutation importance and residual 10th/90th quantiles using validation data only.
9. Refit the chosen pipeline on all official training trajectories after selection.
10. Evaluate once on final rows of the separately supplied official test cohort and official RUL offsets.

Constant/near-constant removal is learned in the pipeline and recorded. The same feature function/order is used by service inference. C-MAPSS train and test files are separate cohorts whose numeric IDs are local to each file; custom three-way splits must call `assert_disjoint_machine_groups` on globally meaningful IDs.

No real metrics exist until authorized files are present. Synthetic fixtures verify software only.
