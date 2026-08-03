# Artifact Contract

```text
artifacts/
├── model.joblib
├── metadata.json
├── feature_schema.json
└── evaluation.json
```

Only project-generated files at the configured local directory are loaded. User-uploaded pickle/joblib files are unsupported.

Metadata records model/version, dataset/subset/fingerprint, exact target formula/unit/cap, ordered features, removed features, feature configuration/schema hash, split method and IDs, seed, machine counts, validation/final metrics, prediction-range method, global/native importance, training ranges, configuration, timestamp, Python/library versions, and training runtime.

Loading verifies all files exist, model is non-empty/readable, JSON is valid, required fields exist, version is supported, feature lists and hashes agree, evaluation state exists, pipeline input width agrees, and model name agrees with the fitted estimator class. Failures use `ModelNotTrainedError`, `ModelArtifactError`, or `FeatureSchemaError`.
