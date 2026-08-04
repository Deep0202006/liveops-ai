# Command-center architecture

`FD001 test trajectories + verified artifact -> deterministic scenario builder -> checksummed static packs -> CDN -> Web Worker -> 2 Hz snapshots -> React command center`.

FastAPI remains stateless and retains all existing endpoints. Static scenario packs contain only selected sensor channels and precomputed real-model outputs. The worker owns play, pause, step, seek, speed, sorting, event replay, and fleet aggregates. React owns presentation and local acknowledgement/pinning state. No database, WebSocket, MQTT, Redis, session, or background service is introduced.

Routes: `/` command center, `/asset/:assetId`, `/maintenance`, `/model`, `/lab`.
