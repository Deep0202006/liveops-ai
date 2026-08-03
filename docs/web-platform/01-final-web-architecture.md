# Final Web Architecture

```text
Future React/Next.js frontend
        -> HTTP/JSON API v1
        -> RULService
        -> validation/features/inference/evaluation
        -> isolated demo or real artifact
```

For the present release, root `app.py` is a temporary Streamlit HTTP client. `src/liveops_web_client` owns client calls; `src/rul_predictor/api` owns HTTP adaptation; `RULService` owns backend operations. Neither API nor client calculates ML features, status thresholds, ranges, explanations, or metrics.
