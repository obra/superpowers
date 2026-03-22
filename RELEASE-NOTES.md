# Superpowers Release Notes

For release history before `v5.1.0 (2026-03-16)`, see the upstream README: https://github.com/obra/superpowers/blob/main/README.md

## v5.6.0 (2026-03-21)

### Session Entry And Repo Safety

- Added runtime-owned `bin/superpowers-session-entry` plus `bin/superpowers-session-entry.ps1` so first-turn Superpowers bootstrap resolves through a helper-backed session-entry contract before the normal `using-superpowers` stack can start
- Added runtime-owned `bin/superpowers-repo-safety` plus `bin/superpowers-repo-safety.ps1` so repo-writing workflow stages fail closed on protected branches unless the current task runs on a non-protected branch or carries explicit task-scoped approval
- Shared repo-relative path, whitespace, identifier, and active-instruction-chain normalization now lives in `bin/superpowers-runtime-common.sh` and `bin/superpowers-pwsh-common.ps1`
- Generated repo-writing workflow skills now call the shared repo-safety preflight before spec writes, plan writes, approval-header edits, execution task slices, release-doc updates, and branch-finishing commands

### Testing

- Added deterministic session-entry helper, supported-entry harness, repo-safety helper, PowerShell wrapper, workflow sequencing, and workflow-adoption regressions for the new bootstrap and protected-branch guarantees
- Added doc-driven Search-Before-Building and using-superpowers routing verification alongside the final execution evidence for the hardening package

## v5.5.0 (2026-03-19)

### Borrowed Layer Alignment

- Added internal `bin/superpowers-slug` so workflow-status and the branch-aware workflow skills share one escaped `SLUG` plus artifact-safe `BRANCH` contract instead of re-deriving repo identity independently
- Generated shared skill preambles now capture raw `_BRANCH` once for grounding while keeping helper `BRANCH` artifact-only for file and manifest naming
- Broadened natural-language skill descriptions for discovery-facing workflow skills while preserving explicit prerequisite wording and fail-closed routing on late-stage skills
- Replaced the retired JS-only `using-superpowers` routing gate with repo-versioned markdown scenario, runner, judge, and orchestrator artifacts plus per-scenario evidence bundles under `~/.superpowers/projects/<slug>/...`
- `bin/superpowers-update-check` now supports `--force`, refreshes cached `UP_TO_DATE` results sooner, and keeps `UPGRADE_AVAILABLE` results sticky longer without changing semver-aware or `local_ahead` behavior

### Testing

- Added `tests/codex-runtime/test-superpowers-slug.sh` for helper fallback, escaping, detached-HEAD, and branch-shape coverage
- Expanded deterministic generator, workflow, and runtime tests for branch-ownership contracts, fail-closed routing guardrails, and update-check freshness behavior

## v5.4.0 (2026-03-18)

### Workflow Runtime

- Added `bin/superpowers-workflow` and `bin/superpowers-workflow.ps1` as the supported public read-only workflow inspection CLI for `status`, `next`, `artifacts`, `explain`, and `help`
- Added a side-effect-free internal `resolve` path inside `bin/superpowers-workflow-status` so the public CLI can inspect workflow state without creating or repairing manifests
- Expanded workflow runtime regression coverage with `tests/codex-runtime/test-superpowers-workflow.sh` plus public-wrapper parity checks in `tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh`
- Hardened the public CLI review surface so artifact inspection works from repo subdirectories, `explain` emits a stable rerun command, and shipped TODO state stays aligned with the released runtime
- Updated README and platform runtime docs to distinguish the public inspection CLI from the internal workflow helper surface

## v5.3.0 (2026-03-17)

### Execution Workflow

- Added `bin/superpowers-plan-execution` plus `bin/superpowers-plan-execution.ps1` to manage execution-ready plan state, recommend the execution skill, and mutate execution progress through `status`, `recommend`, `begin`, `transfer`, `complete`, `note`, and `reopen`
- Added explicit `**Plan Revision:**` and `**Execution Mode:**` plan headers plus revision-scoped execution evidence artifacts keyed to the exact approved plan path
- Updated `plan-eng-review` to hand off execution through `superpowers-plan-execution recommend --plan <approved-plan-path>` instead of a top-level isolated-agent shortcut
- Updated `subagent-driven-development` and `executing-plans` to treat the approved plan checklist as the execution progress record and to drive step state through the helper instead of external task trackers
- Hardened `requesting-code-review` and `finishing-a-development-branch` so plan-routed final review and branch completion fail closed on malformed execution state, stale evidence, or missed reopen requirements

### Execution Workflow Testing

- Added `tests/codex-runtime/test-superpowers-plan-execution.sh` covering execution-state parsing, evidence canonicalization, recommendation routing, malformed-state rejection, and rollback behavior for failed plan/evidence writes
- Expanded workflow sequencing and skill-doc contract coverage so the helper-backed execution handoff, final review gate, and branch-finish gate stay aligned across generated skills and reviewer artifacts

## v5.2.0 (2026-03-16)

### Workflow Enhancements

**Added portable workflow imports from gstack without porting the browser daemon**

- Added `review/checklist.md` and upgraded the reviewer contract to be checklist-driven and base-branch aware
- Added the public `document-release` skill for post-implementation documentation cleanup
- Added the public `qa-only` skill for report-only browser QA using external Playwright-based browser automation support
- Added shared QA support assets at `qa/references/issue-taxonomy.md` and `qa/templates/qa-report-template.md`
- Extended `plan-eng-review` with reusable test-plan artifact output under `~/.superpowers/projects/`
- Extended `finishing-a-development-branch` with stronger base-branch detection plus optional code-review and document-release handoffs
- Tightened workflow-stage ownership across `using-superpowers`, `plan-ceo-review`, `plan-eng-review`, `writing-plans`, `executing-plans`, and `subagent-driven-development` so agents are explicitly routed through the required stage handoffs instead of shortcutting into later skills

### Testing

- Added deterministic `node:test` coverage for generated skill docs, workflow-routing contracts, fixture integrity, and `gen-skill-docs` unit behavior
- Moved historical workflow artifact examples into dedicated fixtures under `tests/codex-runtime/fixtures/workflow-artifacts/` so sequencing tests no longer depend on root `docs/` content
- Added opt-in eval scaffolding for `using-superpowers` routing quality and interactive-question formatting, with lightweight JSON observability under `~/.superpowers/evals/`
- Expanded workflow sequencing tests to lock in approval-gated skill descriptions and explicit terminal-state handoffs between review, planning, and execution skills

### Docs

- README, platform READMEs, and install docs now document the 18-skill runtime and the `~/.superpowers/projects/` artifact convention
- Added `docs/test-suite-enhancement-plan.md` and updated `docs/testing.md` to document the new deterministic Node tests, workflow fixtures, and opt-in eval tier

### Runtime Workflow State

- Added internal workflow-status helper coverage in runtime docs for `bin/superpowers-workflow-status` and `bin/superpowers-workflow-status.ps1`
- Documented branch-scoped workflow manifests at `~/.superpowers/projects/<repo-slug>/<user>-<safe-branch>-workflow-state.json`
- Clarified that workflow-status manifests are local rebuildable indexes while repo docs remain authoritative for approval state
- Added `status --summary` as a human-oriented one-line helper view while keeping default `status` output JSON for machine consumers
- Added repo-root mismatch recovery plus bounded cross-slug recovery for existing branch-scoped workflow manifests
- Added explicit malformed workflow-artifact diagnostics and canonical `reason` helper semantics
- Reconciled the approved workflow-state runtime docs with the shipped helper contract, including terminal `implementation_ready` handling

## v5.1.0 (2026-03-16)

### Generated Skill Runtime Preambles

**Generated skill preambles for all 16 Superpowers skills**

- Every `skills/*/SKILL.md` is now generated from an adjacent `SKILL.md.tmpl` source via `node scripts/gen-skill-docs.mjs`
- A shared base preamble now handles update notices, interactive-question formatting, session-awareness, and contributor mode across the full skill library
- `plan-ceo-review` and `plan-eng-review` extend that base with review-only grounding and `_TODOS_FORMAT` resolution

### Runtime Helpers

- Added `bin/superpowers-config` for local runtime config under `~/.superpowers/config.yaml`
- Added `bin/superpowers-migrate-install` to collapse legacy `~/.codex/superpowers` and `~/.copilot/superpowers` clones into the shared install root at `~/.superpowers/install`
- Added `bin/superpowers-update-check` for per-session upgrade notices, snoozes, and just-upgraded markers
- Added canonical review support files at `review/TODOS-format.md`, `superpowers-upgrade/SKILL.md`, and root `VERSION`
- Added focused runtime tests for the generated-skill contract and the new helper binaries

### Docs

- Codex and GitHub Copilot install docs now document the single shared checkout model, `~/.superpowers/` state, contributor mode, and automatic update-check behavior
- README now documents the generated-skill workflow, the single shared checkout, and the runtime helper contract
