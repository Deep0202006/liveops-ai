# Current product gap

Audit date: 2026-08-03. Baseline: `main@4354e2d`.

The verified Signal Foundry release is a polished prediction utility, not an operations command center. Its default route is a marketing page; its primary product route begins with a file drop; fleet state does not exist; prediction is a one-shot mutation; charts show one uploaded trajectory; and maintenance status is presented only after a user supplies data. There is no shared clock, deterministic replay, event stream, alert triage, fleet comparison, or maintenance queue.

Strengths retained: generated API types, structured errors, RUL Horizon, model evidence, accessible upload workflow, restrained tokens, real FD001 artifact, and stateless FastAPI. The preserved experimental frontend contains dashboard terminology and imagery but mixes unrelated product architecture and is not an implementation base.

Captured baselines are in `docs/command-center/screenshots/`: Signal Foundry home, upload workspace, prediction result, and preserved experimental dashboard.

The correction is therefore structural: `/` becomes an operational fleet view; the upload workflow moves to `/lab`; a deterministic model-backed scenario layer supplies fleet evolution; a Web Worker owns replay; and React renders bounded snapshots at no more than 2 Hz.
