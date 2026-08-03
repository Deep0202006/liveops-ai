# Backend Known Limitations

- Authorized NASA C-MAPSS files are absent; no real artifact or final metrics exist.
- C-MAPSS is simulated turbofan data and cannot establish universal factory-machine validity.
- The 125-cycle cap and 25/50-cycle maintenance thresholds are explicit assumptions, not physical guarantees.
- Residual quantiles provide a lightweight empirical range, not conditional coverage or calibrated probability.
- Global importance and recent changes explain model behavior, not physical causation.
- Cycle gaps are warnings because truncated/irregular histories may still be usable; domain-specific deployments may choose stricter policy.
- Joblib is inherently unsafe for untrusted input; this backend loads only its configured project-generated local file.
- The legacy FastAPI/React simulator remains separate, dirty user work and is not a validated RUL backend.
- A future frontend must adopt `RULService`; no frontend redesign was performed here.
