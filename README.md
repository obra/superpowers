# FeatureForge

FeatureForge is a workflow system for coding agents. It combines a small Rust runtime with a checked-in skill library so planning, execution, review, and finish gates stay grounded in repo-visible artifacts instead of free-form prompt drift.

The active runtime package in this repository targets Codex and GitHub Copilot local installs.

## Provenance

FeatureForge began from upstream Superpowers: https://github.com/obra/superpowers

This repository keeps the workflow-first core and extends it with additional review, execution, and runtime patterns adapted from gstack: https://github.com/garrytan/gstack

## How It Works

Six layers matter:

- `featureforge session-entry` owns first-turn session entry.
- `using-featureforge` is the human-readable entry router after session entry resolves to `enabled`.
- generated skill preambles always invoke the packaged install binary under `~/.featureforge/install/bin/` (`featureforge` on Unix, `featureforge.exe` on Windows), and that runtime resolves the active root through `featureforge repo runtime-root --path` before update checks or contributor-mode lookups.
- `featureforge workflow` owns product-work routing up to `implementation_ready`.
- `featureforge repo-safety` owns protected branches and repo-write guarantees.
- `featureforge plan contract` owns semantic traceability between approved specs, approved plans, and derived task packets.
- `featureforge plan execution` owns execution state after an approved plan is handed off.

Repo-visible artifacts remain authoritative:

- spec approval truth lives in `docs/featureforge/specs/*.md`
- plan approval truth lives in `docs/featureforge/plans/*.md`
- execution truth lives in the approved plan checklist plus paired execution evidence
- branch-scoped local state lives under `~/.featureforge/projects/<repo-slug>/<user>-<safe-branch>-workflow-state.json`

## Installation

FeatureForge uses a single shared checkout for its supported runtime surfaces. Codex and GitHub Copilot local installs both point at `~/.featureforge/install`; only the discovery links differ.

Shared layout:

- `~/.featureforge/install` for the canonical checkout
- `~/.agents/skills/featureforge -> ~/.featureforge/install/skills`
- `~/.copilot/skills -> ~/.featureforge/install/skills`
- `~/.codex/agents/code-reviewer.toml -> ~/.featureforge/install/.codex/agents/code-reviewer.toml`
- `~/.copilot/agents/code-reviewer.agent.md -> ~/.featureforge/install/agents/code-reviewer.md`

Detailed install docs:

- Codex: [docs/README.codex.md](docs/README.codex.md)
- GitHub Copilot: [docs/README.copilot.md](docs/README.copilot.md)
- Checked-in install instructions: [.codex/INSTALL.md](.codex/INSTALL.md) and [.copilot/INSTALL.md](.copilot/INSTALL.md)

## Runtime State

Runtime state lives in `~/.featureforge/`.

- preferences: `~/.featureforge/config/config.yaml`
- session markers: `~/.featureforge/sessions/`
- contributor field reports: `~/.featureforge/contributor-logs/`
- project-scoped artifacts and workflow manifests: `~/.featureforge/projects/`

The repo-local default config for this checkout lives at `.featureforge/config.yaml`.

## Workflow

Default pipeline:

`featureforge:brainstorming -> featureforge:plan-ceo-review -> featureforge:writing-plans -> featureforge:plan-eng-review -> implementation`

Planning chain in plain language:

`brainstorming -> plan-ceo-review -> writing-plans -> plan-eng-review -> implementation`

Execution starts from an engineering-approved plan and the exact approved plan path. `featureforge plan execution recommend --plan <approved-plan-path>` selects between:

- `featureforge:subagent-driven-development` when the approved tasks are independent and isolated-agent execution is viable
- `featureforge:executing-plans` when the work should stay serial in the current session
- recommendation output is topology-backed (`selected_topology`, stable `reason_codes`, and learned-downgrade reuse status), not heuristic-only skill selection

`featureforge plan execution gate-finish --plan <approved-plan-path>` now derives execution-deviation review requirements from authoritative runtime-owned topology downgrade artifacts. Reason-code-only deviation hints are treated as corroborating metadata, not primary truth.

`featureforge plan execution` is the execution preflight boundary for the approved plan.

Completion then flows through:

- `featureforge:requesting-code-review`
- `featureforge:document-release`
- optional `featureforge:qa-only` when browser-facing work or a test plan requires it
- `featureforge:finishing-a-development-branch`

### Runtime Strategy Checkpoints

Execution strategy checkpoints are runtime-owned execution state, not planning-stage transitions.

- `initial_dispatch` is required before repo-writing execution dispatch
- `review_remediation` is recorded automatically for reviewable `gate-review` dispatches and remediation reopen events
- `cycle_break` is recorded automatically when the same task reaches three reviewable dispatch/remediation cycles

The approved plan path/revision remains fixed during execution. Runtime strategy may adjust topology, lane/worktree allocation, and remediation order without sending the workflow back to planning stages.

The runtime records checkpoint history in authoritative harness state (`strategy_checkpoints`) and surfaces checkpoint status in `plan execution status`. Authoritative unit-review receipts are validated against the active `last_strategy_checkpoint_fingerprint`.

Use `featureforge plan execution status --plan <approved-plan-path>` to inspect:

- `strategy_state`
- `strategy_checkpoint_kind`
- `last_strategy_checkpoint_fingerprint`
- `strategy_reset_required`

Reviewers should treat this strategy-checkpoint layer as intentional runtime contract hardening. Do not remove it as "out of plan" cleanup when the implementation and tests prove runtime-owned enforcement behavior.

## Repository Layout

- `skills/` holds the checked-in public skills and their templates
- `agents/` holds generated reviewer artifacts and reviewer source material
- `review/` holds shared review references
- `docs/featureforge/` holds active specs and plans
- `docs/archive/` holds preserved historical project artifacts
- `tests/codex-runtime/fixtures/workflow-artifacts/` holds stable workflow-fixture inputs used by routing and contract tests

## Development

Regenerate generated docs after editing templates or reviewer sources:

```bash
node scripts/gen-skill-docs.mjs
node scripts/gen-agent-docs.mjs
```

The canonical deterministic validation matrix and change-scoped commands live in [docs/testing.md](docs/testing.md).

Core validation:

```bash
node scripts/gen-skill-docs.mjs --check
node scripts/gen-agent-docs.mjs --check
node --test tests/codex-runtime/*.test.mjs
cargo nextest run --test workflow_runtime --test workflow_shell_smoke --test contracts_spec_plan --test runtime_instruction_contracts --test using_featureforge_skill --test session_config_slug --test repo_safety --test update_and_install --test plan_execution --test powershell_wrapper_resolution --test upgrade_skill
```

Refresh checked-in prebuilt binaries (release-facing artifacts) when runtime packaging or binary surfaces change:

```bash
FEATUREFORGE_PREBUILT_TARGET=darwin-arm64 scripts/refresh-prebuilt-runtime.sh
FEATUREFORGE_PREBUILT_TARGET=windows-x64 FEATUREFORGE_PREBUILT_RUST_TARGET=x86_64-pc-windows-gnu scripts/refresh-prebuilt-runtime.sh
cp target/aarch64-apple-darwin/release/featureforge bin/featureforge
chmod +x bin/featureforge
```

## Updating

Update the shared checkout used by supported local installs:

```bash
git -C ~/.featureforge/install pull
```

If your platform copies the reviewer artifact instead of symlinking it, refresh that copied file after updating.

## Support

Open an issue in the repository that hosts this checkout, or start with the checked-in install docs and [docs/testing.md](docs/testing.md).
