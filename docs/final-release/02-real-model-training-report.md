# Real model training report

FD001 machines were split by machine with seed 42. Imputation and variance filtering were fitted within each candidate pipeline on training machines. Dummy median, Ridge, and Extra Trees used identical validation samples. A 125-cycle cap achieved Extra Trees validation MAE 9.38 versus 20.25 uncapped; the cap decision did not use official test truth. The deployable configuration uses 40 trees to keep the artifact at 36.44 MB.

Candidate capped validation MAE/RMSE (cycles): Dummy 36.81/46.31, Ridge 15.33/19.02, Extra Trees approximately 9.38/14.64 in the cap comparison. The final 40-tree run retained Extra Trees under the same deterministic policy.
