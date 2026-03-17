# Workflow Artifact Fixtures

These fixtures preserve the workflow-header contract used by
`tests/codex-runtime/test-workflow-sequencing.sh`.

They were extracted from the historical workflow documents present at
`108c0e8`, before `ce106d0` removed `docs/superpowers/specs/` and
`docs/superpowers/plans/`.

Only the minimum content needed by the test is kept here:

- title
- workflow-state header lines
- source-spec header line for plan fixtures

This keeps the sequencing test self-contained and avoids coupling it to
repository-root documentation that may be reorganized or deleted.
