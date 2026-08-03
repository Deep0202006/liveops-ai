# Component map

| Component | Route/owner | API dependency |
| --- | --- | --- |
| `SystemStateChip` | Global shell and landing | Status |
| `SensorLattice` | Landing hero, empty workspace | None |
| `RULHorizon` | Landing and prediction result | Metadata, evaluation, prediction |
| `UploadWorkbench` | Workspace and landing preview | Samples, dataset inspection |
| `MachineSignalChart` | Workspace, lazy chart chunk | Machine series |
| `MetricTile` | Landing, workspace, evidence | Metadata/evaluation/prediction |
| `EvidencePanel` | Workspace | Prediction and metadata |
| `FocusLensCard` | Upload, RUL, evidence only | None |
| `StatusDrawer` | Global shell | Status and request metadata |

Workspace orchestration belongs to one reducer/state machine with the locked states and explicit reset/cancellation effects. TanStack Query owns server request lifecycle; no second cache is introduced.

