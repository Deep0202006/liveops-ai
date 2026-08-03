# Security and Local Safety Audit

## Findings

- **High:** FastAPI allows all CORS origins with credentials; unsuitable even for a local trusted app.
- **High:** POST bodies are arbitrary dictionaries without schema/enum validation; unknown machine/action values are accepted/logged.
- **High:** raw exception strings are returned to clients and printed, exposing local details.
- **Medium:** no request/file size or CSV validation exists (uploads are not yet implemented).
- **Medium:** SQLite database location is relative and can be created in surprising locations.
- **Medium:** websocket client list is global and websocket exceptions are silently swallowed.
- **Medium:** root `.gitignore` is deleted in the working tree, increasing risk of committing databases, environments, artifacts, datasets, or secrets.
- **Low:** no committed secret pattern was found by code inspection; no `eval`, `exec`, user-built shell command, arbitrary pickle upload, or path traversal route currently exists.
- **Low/positive:** SQL operations use parameter substitution.

## Lightweight repairs

Bind local interfaces only, restrict CORS to expected localhost origins, use typed request models and allowed actions, return safe domain messages, centralize paths, cap/validate any CSV upload, never accept user-uploaded joblib/pickle models, validate bundled artifact metadata/schema, and restore comprehensive ignore rules without deleting existing files.
