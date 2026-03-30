# Issues

- 2026-03-29: `plan-eng-review` write-target drift was identified during the project-memory rollout.
  What changed: The plan review skill and runtime repo-safety surface disagreed about plan-body versus approval-header write targets until the contract was aligned.
  Source: `docs/featureforge/execution-evidence/2026-03-29-featureforge-project-memory-integration-r4-evidence.md`, `skills/plan-eng-review/SKILL.md`

- 2026-03-29: Task-boundary review closure was promoted from rollout follow-up into shipped runtime behavior.
  What changed: Execution now requires review/remediation closure plus verification before the next task can start, instead of leaving that as an open follow-up.
  Source: `docs/featureforge/specs/2026-03-29-per-task-review-gates-design.md`, `docs/featureforge/execution-evidence/2026-03-29-per-task-review-gates-r1-evidence.md`
