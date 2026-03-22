# Testing Superpowers

This repository has three primary automated validation surfaces plus opt-in or change-specific eval gates:

- `tests/codex-runtime/*.test.mjs` for deterministic generated-skill, template, and fixture contracts
- `tests/codex-runtime/` for install docs, generated skill preambles, helper binaries, and upgrade/migration behavior
- `tests/brainstorm-server/` for the brainstorming visual companion server

## Recommended Validation Order

Run these commands from the repository root:

```bash
node scripts/gen-agent-docs.mjs --check
node scripts/gen-skill-docs.mjs --check
node --test tests/codex-runtime/*.test.mjs
bash tests/codex-runtime/test-runtime-instructions.sh
bash tests/codex-runtime/test-using-superpowers-bypass.sh
bash tests/codex-runtime/test-superpowers-session-entry.sh
bash tests/codex-runtime/test-superpowers-session-entry-gate.sh
bash tests/codex-runtime/test-superpowers-plan-contract.sh
bash tests/codex-runtime/test-superpowers-repo-safety.sh
bash tests/codex-runtime/test-workflow-enhancements.sh
bash tests/codex-runtime/test-workflow-sequencing.sh
bash tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh
bash tests/codex-runtime/test-superpowers-plan-execution.sh
bash tests/codex-runtime/test-superpowers-workflow.sh
bash tests/codex-runtime/test-superpowers-workflow-status.sh
bash tests/codex-runtime/test-superpowers-config.sh
bash tests/codex-runtime/test-superpowers-migrate-install.sh
bash tests/codex-runtime/test-superpowers-update-check.sh
bash tests/codex-runtime/test-superpowers-upgrade-skill.sh
bash tests/codex-runtime/test-superpowers-slug.sh
bash tests/brainstorm-server/test-launch-wrappers.sh
npm ci --prefix tests/brainstorm-server
node --test tests/brainstorm-server/server.test.js tests/brainstorm-server/ws-protocol.test.js
```

For prompt-surface or workflow-doc changes, keep validation deterministic-first: regenerate outputs, run the checked deterministic suites, and only then run any higher-order eval gates that exercise agent judgment.

## What Each Suite Covers

### `tests/codex-runtime/*.test.mjs`

- Generated `skills/*/SKILL.md` presence, frontmatter, generated-header, and placeholder coverage
- Semantic preamble contracts for base and review skills
- Unit coverage for `scripts/gen-skill-docs.mjs` pure helper behavior
- Workflow-fixture regression coverage for the sequencing contract

### `tests/codex-runtime/`

- Generated `skills/*/SKILL.md` freshness plus runtime-facing install and workflow contract checks
- `using-superpowers` runtime-owned session-entry wording, decision-file contract, malformed-state fail-closed handling, explicit re-entry semantics, and the deterministic first-turn supported-entry harness gate
- the dedicated `superpowers-session-entry` helper contract for decision resolution, re-entry, deterministic decision paths, and command-input failure handling
- the dedicated `superpowers-plan-contract` helper contract for Requirement Index parsing, coverage-matrix linting, fail-closed ambiguity detection, task-packet generation, and bounded packet-cache behavior
- Protected-branch repo-write guarantees for the repo-safety helper, plus the shared workflow-stage adoption of that gate
- Generated reviewer-agent artifact freshness for Codex and GitHub Copilot
- Runtime helper contracts for config, plan execution, update checks, migration, and upgrade flow
- Supported public workflow CLI contracts for read-only status, next-step, artifact, explain, and failure output
- Workflow-status helper contracts for branch-scoped workflow manifests and conservative stage routing
- PowerShell wrapper behavior, including Git Bash selection and Windows path handling
- Install documentation and supported runtime references
- Required support files such as `VERSION`, `review/TODOS-format.md`, `review/checklist.md`, the shared QA assets, and `superpowers-upgrade/SKILL.md`
- Dedicated workflow-artifact fixtures under `tests/codex-runtime/fixtures/workflow-artifacts/` cover most sequencing-contract cases, while a small number of assertions still intentionally pin checked-in repo docs

### `tests/brainstorm-server/`

- WebSocket protocol behavior for the brainstorming visual companion
- HTTP server behavior and frame-serving expectations
- Shell and PowerShell launch-wrapper smoke coverage

## When To Run What

- Editing any `SKILL.md.tmpl`, runtime helper, or install/readme doc: run `node --test tests/codex-runtime/*.test.mjs` plus the full `tests/codex-runtime/` shell suite
- Editing task-fidelity helpers, packet-backed execution/review prompts, or plan traceability docs: include `bash tests/codex-runtime/test-superpowers-plan-contract.sh`, `bash tests/codex-runtime/test-superpowers-plan-execution.sh`, `bash tests/codex-runtime/test-workflow-sequencing.sh`, and `bash tests/codex-runtime/test-workflow-enhancements.sh`
- Editing `skills/using-superpowers/*`, `scripts/gen-skill-docs.mjs`, or entry-routing docs: include `bash tests/codex-runtime/test-using-superpowers-bypass.sh`, `bash tests/codex-runtime/test-superpowers-session-entry.sh`, `bash tests/codex-runtime/test-superpowers-session-entry-gate.sh`, and review the routing-gate notes below
- Editing protected-branch repo-write guarantees, repo-writing workflow skill docs, or the repo-safety helper: include `bash tests/codex-runtime/test-superpowers-repo-safety.sh`, `bash tests/codex-runtime/test-workflow-enhancements.sh`, and `bash tests/codex-runtime/test-workflow-sequencing.sh`
- Editing brainstorming server files under `skills/brainstorming/scripts/`: run `bash tests/brainstorm-server/test-launch-wrappers.sh` and `node --test tests/brainstorm-server/server.test.js tests/brainstorm-server/ws-protocol.test.js`
- Editing both runtime and brainstorming-server files: run both suites

The brainstorm-server Node tests use a checked-in test-only dependency (`ws`). On a fresh checkout, or whenever `tests/brainstorm-server/node_modules/` is absent, bootstrap that fixture first with:

```bash
npm ci --prefix tests/brainstorm-server
```

## Evals And Change-Specific Gates

- `tests/evals/*.eval.mjs` remains an opt-in quality tier for the Node-driven prompt-behavior checks that still use `.eval.mjs`
- `tests/evals/using-superpowers-routing.orchestrator.md` is the authoritative Item 1 routing gate and drives the repo-versioned scenario, runner, and judge markdown artifacts plus local per-scenario evidence bundles under `~/.superpowers/projects/<slug>/...`
  This gate is agent-executed and does not run through `node --test` or the Node OpenAI-judge helper path. It is not part of the default deterministic validation order, but it is a required change-specific gate for Item 1 routing-safety work.
- `tests/evals/search-before-building-contract.orchestrator.md` is the doc-driven contract gate for the shared Search-Before-Building preamble plus both reviewer prompt surfaces. It uses repo-versioned scenarios plus fresh runner and judge subagents, stays representative instead of exhaustive, and does not require the Node OpenAI-judge helper path.
- `bash tests/codex-runtime/test-using-superpowers-bypass.sh` is the deterministic wording gate for the pre-routing session-entry contract and decision-path surface.
- `bash tests/codex-runtime/test-superpowers-session-entry-gate.sh` is the deterministic first-turn supported-entry harness gate for fresh and malformed session-entry outcomes. It exercises the published bootstrap boundary through a small harness fixture and blocks normal-stack handoff until the harness sees an `enabled` decision. The routing gate above is complementary coverage and assumes the scenario turn starts after that decision has already been resolved to `enabled` using the runner's own derived session-decision path.
- See `tests/evals/README.md` for the Node-based eval environment variables and for routing-eval logging behavior.
- The same README also documents the doc-driven Search-Before-Building runner/judge gate instructions.

Search-Before-Building changes should normally validate in this order:

1. `node scripts/gen-skill-docs.mjs` and `node scripts/gen-skill-docs.mjs --check`
2. `node scripts/gen-agent-docs.mjs` and `node scripts/gen-agent-docs.mjs --check`
3. deterministic codex-runtime coverage such as `gen-skill-docs.unit.test.mjs`, `skill-doc-contracts.test.mjs`, `test-runtime-instructions.sh`, `test-workflow-enhancements.sh`, and `test-workflow-sequencing.sh`
4. the doc-driven `tests/evals/search-before-building-contract.orchestrator.md` gate when you need the higher-order prompt check

That gate uses fresh runner and judge subagents against the checked-in scenario matrix and does not require `OPENAI_API_KEY`. If isolated subagent execution is unavailable in the current environment, skip the gate intentionally and record that limitation.

## Notes

- `test-runtime-instructions.sh` is the contract gate for supported install and runtime documentation, including repo-root workflow diagrams and platform workflow summaries
- `test-using-superpowers-bypass.sh` covers the pre-routing `using-superpowers` session-entry wording, including the decision path, malformed-state fail-closed wording, and explicit re-entry semantics
- `test-superpowers-session-entry.sh` covers the helper-level session-entry contract, including decision resolution, explicit re-entry detection, clause/negation handling, deterministic decision paths, and invalid command input
- `test-superpowers-session-entry-gate.sh` covers the deterministic first-turn supported-entry harness contract, including fresh-session and malformed-state `needs_user_choice` behavior before the harness allows normal-stack handoff
- `test-superpowers-plan-contract.sh` covers Requirement Index and Requirement Coverage Matrix parsing, helper fail-closed lint output, task-packet generation, stale-packet regeneration, and bounded task-packet cache retention
- `test-superpowers-repo-safety.sh` covers the protected-branch repo-write guarantees in the runtime helper, including default protected branches, task-scoped approvals, approval-fingerprint mismatches, and read-only intent behavior
- `test-workflow-enhancements.sh` covers the imported review, QA, document-release, and branch-completion workflow contracts, including the broader packet-backed review wording surface
- `test-workflow-sequencing.sh` covers artifact-state routing, fixture-backed stage gates, plan traceability contract wording, the protected-branch repo-write guarantees at repo-writing workflow stages, and the optional worktree policy using checked-in workflow fixtures in `tests/codex-runtime/fixtures/workflow-artifacts/`
- `tests/codex-runtime/*.test.mjs` covers the deterministic generated-skill and fixture assertions that do not need shell execution
- `test-powershell-wrapper-bash-resolution.sh` covers shared PowerShell wrapper bash selection and override behavior
- `test-superpowers-plan-execution.sh` covers the execution helper state machine, same-revision stale source-spec path rejection, canonical task-structure enforcement, evidence canonicalization, rollback behavior, and malformed evidence rejection
- `test-superpowers-workflow.sh` covers the supported public workflow inspection CLI, including read-only state rendering, missing-expected-path handling, manifest diagnostics, and non-mutation guarantees
- `test-superpowers-workflow-status.sh` covers the internal workflow-state helper, including bootstrap, same-revision stale source-spec path detection, summary-mode parity, repo-identity recovery, malformed-artifact diagnostics, branch isolation, fallback refresh behavior, and conservative write-conflict handling
- `test-superpowers-update-check.sh` covers semver comparison, snooze handling, and just-upgraded markers
- `test-superpowers-upgrade-skill.sh` covers install-root resolution and direct upgrade-flow version resolution
- `test-superpowers-slug.sh` covers the shared slug helper, including missing-remote fallback, detached HEAD handling, and shell-safe escaped output
- `test-launch-wrappers.sh` covers the brainstorm launcher wrappers for Bash and PowerShell, including documented `C:\...` project paths
- `tests/brainstorm-server/server.test.js` and `tests/brainstorm-server/ws-protocol.test.js` cover the brainstorming server's HTTP behavior and websocket protocol semantics
