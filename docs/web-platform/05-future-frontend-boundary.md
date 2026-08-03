# Future Frontend Boundary

The final frontend starts from `docs/web-api/openapi-v1.json`. It may replace Streamlit and the temporary Python client, but must not bypass `/api/v1` or reproduce validation, RUL, preprocessing, maintenance status, ranges, explanations, metrics, or artifact handling.

Preserve the response envelope, request ID, error codes, explicit run mode, demo warning, and stale-state invalidation. Authentication/billing/multi-tenancy remain optional future product decisions, not missing current code.
