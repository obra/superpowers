# Bugs

- 2026-03-29: Review remediation can strand execution when a later parked step blocks reopening earlier completed work.
  Root cause: `reopen` refuses a second interrupted step while `begin` refuses to bypass a different interrupted step.
  Fix: clear or avoid the downstream parked note before reopening the earlier completed step.
  Prevention / verification: keep task-boundary review/verification contract coverage and runtime cycle-break checks in place so review-before-advance execution stays enforced.
  Source: `docs/featureforge/execution-evidence/2026-03-29-featureforge-project-memory-integration-r4-evidence.md`, `docs/featureforge/specs/2026-03-29-per-task-review-gates-design.md`

- 2026-03-29: `plan-eng-review` skill guidance drifted from the runtime write-target names.
  Root cause: the generated skill text kept `repo-file-write` while the runtime CLI exposed `plan-artifact-write` for plan-body writes and `approval-header-write` for the approval flip.
  Fix: align the plan review skill docs with the runtime truth and keep both plan-body and approval-header write targets under contract test coverage.
  Prevention / verification: keep repo-safety write-target assertions on both `plan-artifact-write` and `approval-header-write` so guidance and runtime names fail together.
  Source: `docs/featureforge/execution-evidence/2026-03-29-featureforge-project-memory-integration-r4-evidence.md`, `skills/plan-eng-review/SKILL.md`
