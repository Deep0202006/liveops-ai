# Examiner demonstration guide

Start API v1 with `python -m uvicorn api.index:app --host 127.0.0.1 --port 8000`, then run `cd web && npm install && npm run dev`. Open `http://127.0.0.1:5173`.

On the landing page, verify that the real/demo system state is explicit and model evidence comes from API metadata/evaluation. In `/app`, choose the Monitor sample in demo mode, validate it, select machine 9001, and estimate remaining life. Confirm the RUL Horizon appears before the sensor chart and that the synthetic warning remains visible. `/app/model` explains evaluation, model selection, target construction, provenance, and limitations. Demo validation metrics are never presented as official results.

For real mode, start with `LIVEOPS_MODE=real`, explain FD001 provenance, cycle-based capped RUL, machine-disjoint validation, causal features, and the real 100-machine metrics. Demonstrate one stateless CSV prediction and one invalid upload. Clearly state that FD001 is a simulated benchmark dataset and predictions are estimates rather than guarantees.
