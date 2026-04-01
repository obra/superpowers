# FeatureForge for Codex

This document is the Codex-specific overview for the FeatureForge runtime.

## Install

Use the checked-in installer instructions in [.codex/INSTALL.md](../.codex/INSTALL.md). That file is the source of truth for symlink, copy, and platform-specific setup details.

For a fresh Codex session, the minimal instruction is:

```text
Follow the checked-in instructions in .codex/INSTALL.md from this repository.
```

For the canonical validation matrix after install or update, see [docs/testing.md](testing.md).

## Discovery Layout

FeatureForge installs through one shared checkout:

- `~/.featureforge/install/skills`
- `~/.featureforge/install/.codex/agents/code-reviewer.toml`

Codex discovers those artifacts through:

- `~/.agents/skills/featureforge -> ~/.featureforge/install/skills`
- `~/.codex/agents/code-reviewer.toml -> ~/.featureforge/install/.codex/agents/code-reviewer.toml`

On Windows, the reviewer artifact may be copied instead of symlinked. Refresh that copy after updates.

## Runtime State

Runtime state lives under `~/.featureforge/`.

- config: `~/.featureforge/config/config.yaml`
- sessions: `~/.featureforge/sessions/`
- project artifacts and workflow manifests: `~/.featureforge/projects/`
- contributor logs: `~/.featureforge/contributor-logs/`

## Command Families

The supported command families are:

- `featureforge workflow`
- `featureforge repo-safety`
- `featureforge plan contract`
- `featureforge plan execution`
- `featureforge config`
- `featureforge update-check`
- `featureforge repo runtime-root`
- `featureforge repo slug`

## Workflow Summary

FeatureForge routes product work conservatively from repo-visible artifacts.

Accelerated review is an opt-in branch inside `plan-ceo-review` and `plan-eng-review`, not a separate workflow stage.

- `using-featureforge` is the human-readable entry router that consults `featureforge workflow` directly from repo-visible artifacts.
- `featureforge:project-memory` is an opt-in supportive memory skill for `docs/project_notes/*`; use it only for explicit memory-oriented requests or later follow-up updates, not as a default workflow stage or gate
- generated skill preambles always invoke the packaged install binary under `~/.featureforge/install/bin/` (`featureforge` on Unix, `featureforge.exe` on Windows), and that runtime resolves the active root through `featureforge repo runtime-root --path` before update checks or contributor-mode reads
- generated `using-featureforge` preambles call `featureforge workflow status --refresh` directly; there is no session-entry prerequisite or strict gate env
- `featureforge workflow status --refresh` re-derives the safe next stage from active specs and plans
- `featureforge plan contract` compiles approved markdown into exact execution and review inputs
- `featureforge plan execution recommend --plan <approved-plan-path>` selects execution topology and mode before work starts
- task closure is task-boundary gated: each completed task must first STOP and run `featureforge plan execution gate-review-dispatch --plan <approved-plan-path>` to dispatch dedicated-independent fresh-context review, then pass dedicated-independent fresh-context review loops and a task verification receipt before next-task advancement
- once approved-plan execution has started, execution-phase implementation/review subagent dispatch is pre-authorized and does not require per-dispatch user-consent prompts
- `featureforge plan execution gate-finish --plan <approved-plan-path>` requires deviation disposition from authoritative runtime topology-downgrade artifacts, not reason-code hints alone
- `featureforge plan execution status --plan <approved-plan-path>` surfaces runtime strategy checkpoint state (`strategy_state`, `strategy_checkpoint_kind`, `last_strategy_checkpoint_fingerprint`, `strategy_reset_required`)

Runtime strategy checkpointing is execution-owned, not planning-owned. The runtime records:

- `initial_dispatch` before repo-writing execution starts
- `review_remediation` for reviewable `gate-review-dispatch` calls and remediation reopen events
- `cycle_break` automatically when the same task reaches three reviewable dispatch/remediation cycles

This does not send the workflow back to planning stages; it keeps remediation in execution while preserving approved plan scope.

Checkpoint history is runtime-owned authoritative state (`strategy_checkpoints`). Authoritative unit-review receipts must carry the active strategy checkpoint fingerprint.

Review note: this runtime strategy checkpoint layer is intentional contract hardening and should not be removed as "out-of-plan" cleanup when branch tests and runtime contracts require it.

Default planning pipeline:

`featureforge:brainstorming -> featureforge:plan-ceo-review -> featureforge:writing-plans -> featureforge:plan-eng-review`

## Updating

Update the shared checkout with:

```bash
git -C ~/.featureforge/install pull
```

Then refresh any copied reviewer artifact if your platform does not use symlinks.

## Troubleshooting

1. Verify the skills link exists: `ls -la ~/.agents/skills/featureforge`
2. Verify the reviewer artifact exists: `ls -la ~/.codex/agents/code-reviewer.toml`
3. Verify the runtime responds: run the packaged install binary under `~/.featureforge/install/bin/` (`featureforge` on Unix, `featureforge.exe` on Windows) with `workflow help`
4. Re-run the checked-in install instructions if any link or copied artifact is missing
