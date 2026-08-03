# Architecture

```mermaid
flowchart LR
    D[Official C-MAPSS files] --> V[Schema and trajectory validation]
    V --> T[Cycle-based target]
    T --> S[Machine-disjoint split]
    S --> F[Causal trailing features]
    F --> M[Dummy / Ridge / Extra Trees]
    M --> E[Validation selection]
    E --> A[Trusted pipeline + metadata + schema]
    A --> I[Shared inference]
    I --> U[Local Streamlit UI]
    O[Official truncated test + RUL offsets] --> X[Final held-out evaluation]
    A --> X
```

Responsibilities are separated across data loading, validation, target generation, features, splitting, training, evaluation, artifacts, and inference. Machine ID is grouping metadata, never a numeric model feature. Preprocessing resides inside scikit-learn pipelines. The UI does not reimplement feature logic and never loads user-uploaded model files.
