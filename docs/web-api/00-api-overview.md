# API overview

FastAPI v1.0 is the final, typed, and frozen frontend boundary around `RULService`. It is stateless, mode-isolated, JSON-safe, and request-ID traced. Every frontend-consumed success response has an explicit Pydantic envelope in `openapi-v1.json`; production entry is `api/index.py`. Real and demo artifacts are never interchanged.

**Contract status: API V1.0: FINAL, TYPED AND FROZEN FOR FRONTEND.**
