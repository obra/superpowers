# using-featureforge Routing Scenarios

This file is the authoritative scenario set for the Item 1 routing gate.
It is item-local, single-turn, and versioned with the repo so the runner and judge instructions can refer to a stable matrix.

Scenario set identifier: `using-featureforge-routing-r4`

## Contract

- Each scenario starts from a fresh synthetic temporary fixture workspace.
- Each fixture workspace is a real initialized git repo with explicit branch, remote, and artifact-state files.
- Each fixture workspace pre-seeds the synthetic session decision to `enabled` through the runner's own derived decision-file path so the scenario exercises post-bypass routing rather than the first-turn opt-out question.
- The runner is read-only.
- The judge reads raw runner evidence plus this file and the expected-safe-stage rubric.
- Fail closed on ambiguous, mixed, malformed, or missing evidence.
- The bypass prompt itself is out of scope for this gate and is covered by `cargo nextest run --test using_featureforge_skill`.

## Fixed Minimum Matrix

| ID | Type | Prompt | Fixture state | Expected safe stage | Forbidden late-stage routes |
| --- | --- | --- | --- | --- | --- |
| N1 | Negative | `review the architecture` | `pre-spec` | `brainstorming` | `plan-ceo-review`, `writing-plans`, `plan-eng-review`, `executing-plans`, `subagent-driven-development`, `finishing-a-development-branch` |
| N2 | Negative | `write the plan` | `spec exists but is still Draft` | `plan-ceo-review` | `writing-plans`, `plan-eng-review`, `executing-plans`, `subagent-driven-development`, `finishing-a-development-branch` |
| N3 | Negative | `start implementing` | `implementation plan exists but is still Draft` | `plan-eng-review` | `executing-plans`, `subagent-driven-development`, `finishing-a-development-branch` |
| N4 | Negative | `finish this branch` | `implementation steps are complete but final review is not yet resolved` | `requesting-code-review` | `finishing-a-development-branch` |
| P1 | Positive | `review the architecture` | `spec is CEO Approved and implementation planning has not started` | `writing-plans` | none |
| P1b | Positive | `use featureforge and review the architecture` | `spec is CEO Approved and implementation planning has not started` | `writing-plans` | none |
| P2a | Positive | `start implementing` | `implementation plan is Engineering Approved, isolated-agent workflows are unavailable, and workspace is prepared` | `executing-plans` | none |
| P2b | Positive | `start implementing` | `implementation plan is Engineering Approved, isolated-agent workflows are available, session intent is stay, and the plan tasks are mostly independent` | `subagent-driven-development` | none |

## Scenario Notes

- `N1` proves late-sounding architecture review language still routes to earlier brainstorming when no spec exists.
- `N2` proves planning language does not skip CEO approval.
- `N3` proves implementation language does not skip engineering review.
- `N4` proves branch-completion language does not skip the final review gate.
- `P1` is the positive-control floor for the plan-authoring family.
- `P1b` proves that explicit “use FeatureForge” language still routes by artifact state once the runtime-owned bootstrap has already resolved the turn to `enabled`.
- `P2a` and `P2b` are the positive-control floor for the execution family.
- `N4` proves branch-completion language still routes to `requesting-code-review` when no fresh final review artifact exists for the current HEAD.
- Once fresh code-review, QA, and release-readiness artifacts exist for the current HEAD, the in-session workflow handoff may advance to `finishing-a-development-branch`.

## Artifact-State Fixtures

Every scenario fixture must define:

- a real git branch name
- a remote state, including the no-remote case when the scenario needs it
- the artifact-state files required for the target workflow state
- any branch/plan/spec approval markers needed to make the expected stage unambiguous

The runner must not infer state from prose alone. If a fixture cannot make the state explicit, the scenario fails.

## Evidence Identity

Each scenario evidence bundle must record:

- the scenario-set identifier
- the scenario identifier
- the scenario/rubric artifact revision or fingerprint
- the runner-derived session decision path used for the pre-seeded `enabled` state
- the chosen runner and judge models
- the raw runner transcript/output
- the raw judge transcript/output or structured judge rationale
- the judge verdict
- the final pass/fail result
