# Dataset Report

NASA C-MAPSS FD001 is simulated run-to-failure turbofan degradation data. Each row contains a machine identifier, operating cycle, three operating settings, and 21 sensor channels. Training trajectories reach their simulated endpoint; official test trajectories are truncated and use one official RUL offset per machine.

Target for training row \(i,t\):

\[
RUL_{i,t} = \max_t(cycle_i) - cycle_{i,t}
\]

The configured cap is 125 cycles and is an explicit modeling assumption. The final training cycle has RUL 0; labels cannot be negative. The loader rejects missing/non-numeric/infinite fields and duplicate machine-cycle keys, then sorts chronologically.

Citation: A. Saxena and K. Goebel (2008), “Turbofan Engine Degradation Simulation Data Set,” NASA Ames Prognostics Data Repository.

Current local audit status: official data were not present, and NASA's official page reported temporary download unavailability. Consequently, row/machine counts and empirical quality statistics remain blocked until authorized files are supplied.
