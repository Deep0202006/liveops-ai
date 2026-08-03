# Product and Architecture Correction

LiveOps AI is a lightweight browser-based predictive-maintenance website with a Python ML backend and versioned HTTP API. It is not a desktop application, standalone launcher product, or final Streamlit product.

The current temporary Streamlit client calls HTTP `/api/v1`; the future React/Next.js presentation will replace that client without changing the API or ML backend. FastAPI wraps the frozen `RULService`, which remains the only ML boundary. Demo and real API processes are explicitly isolated.

Non-goals for this academic local release are authentication, billing, accounts, multi-tenancy, databases, cloud deployment, streaming, and industrial certification. The dirty root `backend/` and `frontend/` experiments are preserved legacy work and are not canonical runtime components.
