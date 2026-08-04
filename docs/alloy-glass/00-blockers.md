# Alloy Glass release blockers

## Vercel project-ID verification

Local and GitHub evidence verifies the connected deployment slug as
`zero-data/liveops-ai-rul`. GitHub reports the existing production deployment at
main commit `4354e2d595f0765d9152ea3303ebf005e519fc86`, with the canonical alias
`https://liveops-ai-rul.vercel.app`.

The exact project ID required by the release directive,
`prj_jaFYmeXSlE5q910H37YV2UyJmqQN`, cannot currently be independently verified
from this workstation because:

- no `.vercel/project.json` link file exists;
- the Vercel CLI is not installed;
- no Vercel authentication token or authenticated Vercel session is available.

This does not block local implementation or verification. It is a hard stop for
direct Vercel linking, deployment, Preview approval, merge, and Production
release until authenticated evidence confirms the exact project ID and the
`zero-data` scope. GitHub push and pull-request creation will also be deferred
until the remote-release identity gate is resolved.

No Vercel project or team setting has been modified.
