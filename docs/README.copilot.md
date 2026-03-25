# FeatureForge for GitHub Copilot Local Installs

This document is the GitHub Copilot-specific overview for the FeatureForge runtime.

## Install

Use the checked-in installer instructions in [.copilot/INSTALL.md](../.copilot/INSTALL.md). That file is the source of truth for symlink, copy, and platform-specific setup details.

For a fresh Copilot session, the minimal instruction is:

```text
Follow the checked-in instructions in .copilot/INSTALL.md from this repository.
```

## Discovery Layout

FeatureForge installs through one shared checkout:

- `~/.featureforge/install/skills`
- `~/.featureforge/install/agents/code-reviewer.md`

GitHub Copilot discovers those artifacts through:

- `~/.copilot/skills -> ~/.featureforge/install/skills`
- `~/.copilot/agents/code-reviewer.agent.md -> ~/.featureforge/install/agents/code-reviewer.md`

On Windows, the reviewer artifact is typically copied instead of symlinked. Refresh that copy after updates.

## Runtime State

Runtime state lives under `~/.featureforge/`.

- config: `~/.featureforge/config/config.yaml`
- sessions: `~/.featureforge/sessions/`
- project artifacts and workflow manifests: `~/.featureforge/projects/`
- contributor logs: `~/.featureforge/contributor-logs/`

## Command Families

The supported command families are:

- `featureforge session-entry`
- `featureforge workflow`
- `featureforge repo-safety`
- `featureforge plan contract`
- `featureforge plan execution`
- `featureforge config`
- `featureforge update-check`
- `featureforge repo slug`

## Workflow Summary

FeatureForge routes product work conservatively from repo-visible artifacts.

Accelerated review is an opt-in branch inside `plan-ceo-review` and `plan-eng-review`, not a separate workflow stage.

- `using-featureforge` is the human-readable entry router after `featureforge session-entry`
- `featureforge workflow status --refresh` re-derives the safe next stage from active specs and plans
- `featureforge plan contract` compiles approved markdown into exact execution and review inputs
- `featureforge plan execution recommend --plan <approved-plan-path>` selects the execution mode before work starts

Default planning pipeline:

`featureforge:brainstorming -> featureforge:plan-ceo-review -> featureforge:writing-plans -> featureforge:plan-eng-review`

## Updating

Update the shared checkout with:

```bash
git -C ~/.featureforge/install pull
```

Then refresh any copied reviewer artifact if your platform does not use symlinks.

## Troubleshooting

1. Verify the skills link exists: `ls -la ~/.copilot/skills`
2. Verify the reviewer artifact exists: `ls -la ~/.copilot/agents/code-reviewer.agent.md`
3. Verify the runtime responds: `~/.featureforge/install/bin/featureforge workflow help`
4. Re-run the checked-in install instructions if any link or copied artifact is missing
