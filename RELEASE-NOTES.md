# Superpowers Release Notes

For release history before `v5.1.0 (2026-03-16)`, see the upstream README: https://github.com/obra/superpowers/blob/main/README.md

## v5.7.0 (2026-03-22)

### Rust Runtime Cutover

- Cut the runtime over to the Rust `superpowers` binary while keeping the repo-visible workflow artifacts authoritative and the install surface canonical
- Added checked-in prebuilt runtime artifacts under `bin/prebuilt/` for `darwin-arm64` and `windows-x64`, with manifest-backed checksum verification during `superpowers install migrate`
- Switched the normal install path to provision the host-matching checked-in runtime into `~/.superpowers/install/bin` instead of requiring a local Rust toolchain on supported targets
- Added checked-in benchmark thresholds plus `bash scripts/check-runtime-benchmarks.sh` for the workflow-status, plan-contract, and execution-status hot paths
- Treat the release gate as requiring blocking macOS arm64 fresh-install evidence plus blocking Windows x64 manifest/provisioning/checksum/artifact evidence, with direct Windows-host launch proof deferred to follow-on validation when a real Windows host is available

### Task Fidelity Contract

- Added internal `superpowers plan contract` so execution-bound specs and approved plans can be linted for Requirement Index and Requirement Coverage Matrix fidelity before planning, execution, or review proceeds
- Added shared canonical task-structure parsing through `bin/superpowers-plan-structure-common` and tightened `superpowers plan execution` so malformed `## Task N:` or `**Files:**` structure fails closed earlier
- Updated `writing-plans` and `plan-eng-review` so new or revised execution plans must carry canonical task blocks, explicit spec coverage, resolved open questions, and a plan-contract lint gate before engineering approval
- Updated `executing-plans`, `subagent-driven-development`, `requesting-code-review`, and the implementer/reviewer prompt surfaces so execution and review consume helper-built task packets instead of controller-written semantic summaries
- Added the task-fidelity design spec, engineering-approved implementation plan, and execution-evidence artifact under `docs/superpowers/` so the new contract ships with repo-visible source artifacts

### Review And Routing Hardening

- Hardened `superpowers session-entry` so bypassed sessions recognize more explicit natural-language re-entry requests and still fail closed on invalid or whitespace-only session keys
- Tightened `requesting-code-review` and `finishing-a-development-branch` so they treat non-null `active_task`, `blocking_task`, or `resume_task` status fields as execution-dirty and stop instead of reviewing or finishing against guessed plan state
- Clarified `subagent-driven-development` and `document-release` ownership so task packets stay authoritative, coordinator-owned git actions stay explicit, and release-doc edits force a fresh review before branch completion
- Updated `using-superpowers` manual fallback wording to match helper behavior when artifacts are ambiguous instead of implying “pick the newest” and continue

### Runtime Integration Hardening

- Expanded `superpowers workflow` from the original inspection subset into the full read-only operator surface for `phase`, `doctor`, `handoff`, `preflight`, `gate review`, and `gate finish`, while keeping `next` at the execution preflight boundary
- Added helper-owned execution `preflight`, `gate-review`, and `gate-finish` checks plus evidence-v2 provenance in `superpowers plan execution`
- Added structured QA-result and release-readiness artifacts so `qa-only`, `document-release`, and `finishing-a-development-branch` can fail closed on stale or mismatched late-stage evidence instead of relying on prose-only assertions
- Moved `using-superpowers` to the runtime-owned session-entry gate first and turned legacy brainstorming, plan-writing, and execute-plan command docs into compatibility shims that route through the supported workflow surfaces
- Optimized the read-only helpers with shell-native parsing plus read-only derived-output caches keyed to authoritative artifact stamps so warm-path `status`, `lint`, `analyze-plan`, and workflow inspection calls stay subsecond without weakening fail-closed behavior

### Testing

- Added dedicated plan-contract shell regression coverage plus fixture coverage for missing indexes, missing coverage, unknown IDs, ambiguity, requirement weakening, malformed task structure, malformed `Files:` blocks`, path traversal rejection, stale packets, and retention pruning
- Expanded execution, workflow sequencing, workflow enhancement, runtime-instruction, session-entry, and skill-doc contract coverage so canonical task syntax, packet-backed execution/review wording, helper-backed routing, and coordinator-owned git semantics stay aligned
- Strengthened the supported-entry harness to verify real normal-stack side effects and added real approved-artifact packet coverage for the task-fidelity spec and plan
- Added warm-path slowdown guards and cache-invalidation regressions for `superpowers plan contract`, `superpowers plan execution`, `superpowers workflow`, and `superpowers workflow` so helper speed regressions are caught before they creep back in

## v5.6.0 (2026-03-21)

### Session Entry And Repo Safety

- Added runtime-owned `superpowers session-entry` so first-turn Superpowers bootstrap resolves through a helper-backed session-entry contract before the normal `using-superpowers` stack can start
- Added runtime-owned `superpowers repo-safety` so repo-writing workflow stages fail closed on protected branches unless the current task runs on a non-protected branch or carries explicit task-scoped approval
- Shared repo-relative path, whitespace, identifier, and active-instruction-chain normalization now lives in `bin/superpowers-runtime-common.sh` and `bin/superpowers-pwsh-common.ps1`
- Generated repo-writing workflow skills now call the shared repo-safety preflight before spec writes, plan writes, approval-header edits, execution task slices, release-doc updates, and branch-finishing commands

### Testing

- Added deterministic session-entry helper, supported-entry harness, repo-safety helper, PowerShell wrapper, workflow sequencing, and workflow-adoption regressions for the new bootstrap and protected-branch guarantees
- Added doc-driven Search-Before-Building and using-superpowers routing verification alongside the final execution evidence for the hardening package

## v5.5.0 (2026-03-19)

### Borrowed Layer Alignment

- Added internal `superpowers repo slug` so workflow-status and the branch-aware workflow skills share one escaped `SLUG` plus artifact-safe `BRANCH` contract instead of re-deriving repo identity independently
- Generated shared skill preambles now capture raw `_BRANCH` once for grounding while keeping helper `BRANCH` artifact-only for file and manifest naming
- Broadened natural-language skill descriptions for discovery-facing workflow skills while preserving explicit prerequisite wording and fail-closed routing on late-stage skills
- Replaced the retired JS-only `using-superpowers` routing gate with repo-versioned markdown scenario, runner, judge, and orchestrator artifacts plus per-scenario evidence bundles under `~/.superpowers/projects/<slug>/...`
- `superpowers update-check` now supports `--force`, refreshes cached `UP_TO_DATE` results sooner, and keeps `UPGRADE_AVAILABLE` results sticky longer without changing semver-aware or `local_ahead` behavior

### Testing

- Added dedicated repo-slug shell regression coverage for helper fallback, escaping, detached-HEAD, and branch-shape behavior
- Expanded deterministic generator, workflow, and runtime tests for branch-ownership contracts, fail-closed routing guardrails, and update-check freshness behavior

## v5.4.0 (2026-03-18)

### Workflow Runtime

- Added `superpowers workflow` as the supported public read-only workflow inspection CLI for `status`, `next`, `artifacts`, `explain`, and `help`
- Added a side-effect-free internal `resolve` path inside `superpowers workflow` so the public CLI can inspect workflow state without creating or repairing manifests
- Expanded workflow runtime regression coverage plus public-wrapper parity checks in the PowerShell wrapper suite
- Hardened the public CLI review surface so artifact inspection works from repo subdirectories, `explain` emits a stable rerun command, and shipped TODO state stays aligned with the released runtime
- Updated README and platform runtime docs to distinguish the public inspection CLI from the internal workflow helper surface

## v5.3.0 (2026-03-17)

### Execution Workflow

- Added `superpowers plan execution` to manage execution-ready plan state, recommend the execution skill, and mutate execution progress through `status`, `recommend`, `begin`, `transfer`, `complete`, `note`, and `reopen`
- Added explicit `**Plan Revision:**` and `**Execution Mode:**` plan headers plus revision-scoped execution evidence artifacts keyed to the exact approved plan path
- Updated `plan-eng-review` to hand off execution through `superpowers plan execution recommend --plan <approved-plan-path>` instead of a top-level isolated-agent shortcut
- Updated `subagent-driven-development` and `executing-plans` to treat the approved plan checklist as the execution progress record and to drive step state through the helper instead of external task trackers
- Hardened `requesting-code-review` and `finishing-a-development-branch` so plan-routed final review and branch completion fail closed on malformed execution state, stale evidence, or missed reopen requirements

### Execution Workflow Testing

- Added dedicated plan-execution shell regression coverage for execution-state parsing, evidence canonicalization, recommendation routing, malformed-state rejection, and rollback behavior for failed plan and evidence writes
- Expanded workflow sequencing and skill-doc contract coverage so the helper-backed execution preflight handoff, final review gate, and branch-finish gate stay aligned across generated skills and reviewer artifacts

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

- Added internal workflow-status helper coverage in runtime docs for `superpowers workflow`
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

- Added `superpowers config` for local runtime config under `~/.superpowers/config/config.yaml`
- Added `superpowers install migrate` to collapse legacy `~/.codex/superpowers` and `~/.copilot/superpowers` clones into the shared install root at `~/.superpowers/install`
- Added `superpowers update-check` for per-session upgrade notices, snoozes, and just-upgraded markers
- Added canonical review support files at `review/TODOS-format.md`, `superpowers-upgrade/SKILL.md`, and root `VERSION`
- Added focused runtime tests for the generated-skill contract and the new helper binaries

### Docs

- Codex and GitHub Copilot install docs now document the single shared checkout model, `~/.superpowers/` state, contributor mode, and automatic update-check behavior
- README now documents the generated-skill workflow, the single shared checkout, and the runtime helper contract
