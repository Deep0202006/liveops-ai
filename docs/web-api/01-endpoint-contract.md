# Endpoint Contract

Endpoints: health live/ready; status; model metadata/evaluation; demo sample catalogue; stateless CSV dataset inspection; stateless machine summary/series; and prediction. There are no dataset IDs, registry calls, sample-download endpoint, or delete operations. See generated `openapi-v1.json` for authoritative methods, parameters, and typed schemas.

Real mode keeps health, status, and validation operational without a model. Demo routes return 409 in real mode; prediction returns 503 `MODEL_NOT_TRAINED` until a real artifact exists.
