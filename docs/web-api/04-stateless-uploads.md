# Stateless uploads

Dataset inspection, machine inspection, series, and prediction each accept the current CSV as multipart form data. The 4 MiB limit is enforced from bytes read by the server. No dataset ID, registry, TTL, deletion call, database, or filesystem persistence exists.
