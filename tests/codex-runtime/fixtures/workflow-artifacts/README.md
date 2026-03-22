# Workflow Artifact Fixtures

These fixtures preserve the workflow-header contract used by
`tests/codex-runtime/test-workflow-sequencing.sh`.

Most fixtures were extracted from the historical workflow documents
present at `108c0e8`, before `ce106d0` removed
`docs/superpowers/specs/` and `docs/superpowers/plans/`.
The stale source-spec path case is a small synthetic addition that
models the newer governance edge case.

Only the minimum content needed by the test is kept here:

- title
- workflow-state header lines
- source-spec header line for plan fixtures
- Requirement Index and Requirement Coverage Matrix structure where sequencing coverage needs it
- canonical `## Task N:` plus parseable `**Files:**` blocks where execution-stage sequencing coverage needs it
- a stale source-spec path case where a newer approved spec path exists at the same revision

This keeps the sequencing test self-contained and avoids coupling it to
repository-root documentation that may be reorganized or deleted.
