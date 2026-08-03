# FD001 Real-Data Training Checklist

Supply authorized, unmodified files with exact names:

```text
data/raw/train_FD001.txt
data/raw/test_FD001.txt
data/raw/RUL_FD001.txt
```

Then validate, train once, evaluate, and verify using the commands in the release report. Validation checks the 26-column C-MAPSS schema, numeric values, positive integer machine/cycle keys, duplicates, trajectory lengths, and truth-label count. The training content/schema fingerprint and split/model policy are stored in the artifact metadata. Acquisition is manual; the project does not download unofficial copies.

Before accepting results, confirm official test truth was used only after validation-based model selection and that the artifact was written to `artifacts/real`.
