# API consumption map

| Operation | Consumer | Lifecycle | OpenAPI state |
| --- | --- | --- | --- |
| `GET /api/v1/status` | Global system state, mode disclosure | Poll on load/refocus; invalidates API-derived state on version or mode change | Typed |
| `GET /api/v1/model/metadata` | Landing evidence, RUL thresholds, model evidence | Shared metadata query | Typed |
| `GET /api/v1/model/evaluation` | Landing metrics, model evidence visuals | Shared evaluation query, evidence route lazy-loaded | Typed |
| `GET /api/v1/demo/samples` | Upload Workbench demo selector | Demo mode only; `409` in real mode | Typed |
| `POST /api/v1/datasets/inspect` | Upload validation and machine selection | Multipart; cancel on file replacement | Typed |
| `POST /api/v1/machines/inspect` | Machine summary | Multipart; cancel on file/machine replacement | Typed |
| `POST /api/v1/machines/series` | MachineSignalChart | Multipart with comma-separated sensors; cancel obsolete requests | Typed |
| `POST /api/v1/predictions` | RULHorizon and EvidencePanel | Multipart; cancel on file/machine replacement | Typed |

All operations use the same-origin production base, `/api/v1`, with one optional development origin. Stable error codes and `meta.request_id` are preserved. Validation errors are never retried; temporary `5xx` availability failures may be retried once.

No demo sample download endpoint exists. The catalogue returns filenames only. The three checked-in sample CSV files will be copied as static frontend assets so the browser can submit them through the same typed inspection and prediction endpoints without adding API behavior.
