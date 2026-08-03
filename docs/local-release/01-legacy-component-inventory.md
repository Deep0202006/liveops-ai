# Legacy Component Inventory

| Path | Apparent purpose | Canonical release | Build state | Decision |
|---|---|---|---|---|
| `backend/` | FastAPI/SQLite LiveOps simulator with orchestrator and WebSocket code | Not used or required | Not verified because preserved dirty user work is outside this release | Preserve for future review; exclude its requirements and server |
| `frontend/` | React/Vite interface experiment | Not used or required | Not verified; extensive preserved modified/untracked work exists | Preserve for later frontend redesign; exclude Node dependencies |
| Root media, PRD/roadmap, archives | Design/reference material | Not used | Not applicable | Preserve untouched |

Canonical commands start only Streamlit and the Python RUL package. No legacy folder was deleted, staged, or required.
