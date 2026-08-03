# Model card

The real model is a 40-estimator Extra Trees scikit-learn pipeline trained on NASA C-MAPSS FD001. Target: `min(final failure cycle - current cycle, 125)` cycles. Machine-disjoint internal validation chose the model/cap; official truth evaluated the frozen model on 100 truncated test machines. Final MAE 14.4395, RMSE 19.8544, median AE 9.3938, R² 0.7717. Intended for academic predictive-maintenance demonstration, not safety certification.
