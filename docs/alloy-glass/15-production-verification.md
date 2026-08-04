# Alloy Glass Production verification

## Status

**NOT PERFORMED — PREVIEW, MERGE, AND PROJECT-ID GATES ARE OPEN**

The Alloy Glass branch has not been pushed or merged into `main`; therefore no
Alloy Glass Production deployment exists to verify. The currently observed
Production deployment belongs to the pre-redesign `main` commit and must not be
presented as evidence for this release.

## Existing Production baseline

- Repository `main` SHA before the Alloy Glass release:
  `4354e2d595f0765d9152ea3303ebf005e519fc86`
- GitHub Production deployment evidence points to:
  `zero-data/liveops-ai-rul`
- Canonical alias: `https://liveops-ai-rul.vercel.app`
- Alloy Glass starting commit:
  `90111eee0911ef6b1a58a94130b748bf56b431d2`
- Alloy Glass feature branch: `feat/alloy-glass-command-center`

The existing Production baseline has not been modified by this work.

## Required gates before Production verification

1. Independently authenticate Vercel project ID
   `prj_jaFYmeXSlE5q910H37YV2UyJmqQN` and scope `zero-data`.
2. Complete all local release gates and record the final feature SHA.
3. Push the feature branch without force.
4. Create the pull request and verify its Vercel Preview.
5. Merge through GitHub only after Preview passes.
6. Confirm Vercel Production deploys the merged `main` SHA.

## Production checklist awaiting execution

The merged deployment must be verified independently for:

- landing, command center, maintenance, comparison, Model Evidence, and Data
  Lab routes, including direct refresh;
- mobile and reduced-motion experiences;
- API status, model metadata, scenario assets, and one real prediction;
- scenario controls, alert filters, pinned comparison, and time controls;
- console errors, failed network requests, runtime logs, and model parity;
- ten-minute simulation stability and mobile screenshot QA;
- confirmation that no other Git repository, Vercel project, or team setting
  changed.

## Rollback readiness

The pre-release rollback points are preserved:

- Git baseline `main`:
  `4354e2d595f0765d9152ea3303ebf005e519fc86`
- Permanent local backup branch:
  `backup/command-center-before-alloy-glass-20260804`
- Backup branch starting SHA:
  `90111eee0911ef6b1a58a94130b748bf56b431d2`

If a future Production release has a P0 or P1 regression, restore the previous
Vercel Production deployment and revert the merge through Git. Do not
force-push or patch `main` directly. Preserve evidence, fix on a focused branch,
and repeat Preview verification.

## Result

```text
PULL REQUEST: NOT CREATED
PULL REQUEST MERGE: NOT PERFORMED
ALLOY GLASS PRODUCTION DEPLOYMENT: NOT PERFORMED
PRODUCTION ROUTES: NOT VERIFIED FOR ALLOY GLASS
PRODUCTION API: NOT VERIFIED FOR ALLOY GLASS
PRODUCTION REAL PREDICTION: NOT VERIFIED FOR ALLOY GLASS
PRODUCTION LOG REVIEW: NOT PERFORMED
PRODUCTION RELEASE DECISION: BLOCKED
```

No rollback action was required because no remote release action occurred.
