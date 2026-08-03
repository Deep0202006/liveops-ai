# Request and response models

Every response uses `success`, JSON-safe `data`, `error`, and `meta` containing API version and request ID. Frontend-consumed success payloads are explicit component schemas for status, metadata, evaluation metrics, demo samples, dataset validation, machine inspection, sensor series, and prediction. Data operations accept a CSV `file` plus machine/sensor form fields where applicable. The series `sensors` field is a comma-separated string. No registry identifier, pandas/NumPy object, estimator, file handle, or internal path is exposed.
