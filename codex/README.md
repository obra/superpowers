# Sonbbal Superpowers for Codex

Codex-focused Superpowers plugin package.

This package is intentionally separate from the Claude Code package so each harness can keep idiomatic instructions:

- Claude Code package: `../claude-code/`
- Codex package: this directory, `codex/`

## What This Package Contains

This package provides the Codex-compatible Superpowers skill set under `codex/skills`:

- `api-edr-validation`
- `audit-verification`
- `brainstorming`
- `context-window-management`
- `dispatching-parallel-agents`
- `executing-plans`
- `finishing-a-development-branch`
- `model-assignment`
- `project-scoping`
- `receiving-code-review`
- `requesting-code-review`
- `subagent-driven-development`
- `systematic-debugging`
- `team-driven-development`
- `test-driven-development`
- `using-git-worktrees`
- `using-superpowers`
- `verification-before-completion`
- `wiki-management`
- `writing-plans`
- `writing-skills`

The plugin metadata is in `.codex-plugin/plugin.json`, and Codex discovers skills from `./skills`.

## How This Differs From Claude Code

The Codex package uses Codex-native workflow language:

- `update_plan` for visible task tracking.
- Inline execution by default.
- `spawn_agent`, `send_input`, and `wait_agent` only when the user explicitly requests subagents, delegation, parallel agent work, or a team workflow.
- Local review checklists when delegation is not authorized.

Claude Code keeps Claude-native agents, commands, and hooks in `../claude-code/`.

## Installation

See [INSTALL.md](INSTALL.md).

## Symlink Fallback

If your Codex setup uses native skill discovery directly:

```bash
mkdir -p ~/.agents/skills
ln -s ~/.codex/superpowers/codex/skills ~/.agents/skills/sonbbal-superpowers-codex
```

Windows PowerShell:

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.agents\skills"
cmd /c mklink /J "$env:USERPROFILE\.agents\skills\sonbbal-superpowers-codex" "$env:USERPROFILE\.codex\superpowers\codex\skills"
```

Restart Codex after installation so skills are rediscovered.

## Compatibility Tests

Run the Codex package test from the repository root:

```bash
bash tests/codex/test-plugin-package.sh
```

Run the Codex compatibility checks:

```bash
bash tests/codex/test-codex-skill-language.sh
```

## Known Limitations

- Claude Code `agents/`, `commands/`, and `hooks/` are not ported into Codex.
- Team-driven workflows use local checklists unless the user explicitly authorizes Codex delegation.
- There is no runtime bridge for other harness-specific team APIs.
