# Error Contract

Expected errors contain stable `code`, safe `message`, `recoverable`, and safe `details`. Invalid input/schema/history maps to 400/422, not-found to 404, mode conflict to 409, too-large to 413, media type to 415, model/artifact unavailability to 503, and unexpected failures to safe 500 responses. Request IDs are returned in body/header; raw tracebacks are logged only for unexpected local failures.
