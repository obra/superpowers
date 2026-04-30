# Sonbbal Superpowers for Codex

Codex-focused Superpowers plugin package.

This package is intentionally separate from the root Claude Code package so each harness can keep idiomatic instructions:

- Claude Code package: repository root, `.claude-plugin/`, `hooks/`, root `skills/`
- Codex package: `plugins/sonbbal-superpowers-codex/`

## What This Package Contains

This package provides the Codex-compatible Superpowers skill set currently ported under `plugins/sonbbal-superpowers-codex/skills`:

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
- `writing-plans`
- `wiki-management`
- `writing-skills`

The plugin metadata is in `.codex-plugin/plugin.json`, and Codex discovers skills from `./skills`.

## How This Differs From The Root Package

The root package remains the Claude Code package and keeps the original Claude-oriented workflow language.

The Codex package uses Codex-native workflow language:

- `update_plan` for visible task tracking.
- Inline execution by default.
- `spawn_agent`, `send_input`, and `wait_agent` only when the user explicitly requests subagents, delegation, parallel agent work, or a team workflow.
- Local review checklists when delegation is not authorized.

## Installation

Clone Sonbbal's repository:

```bash
git clone https://github.com/Sonbbal/superpowers.git ~/.codex/superpowers
```

When installing through Codex plugin metadata, use the package in this directory:

```text
plugins/sonbbal-superpowers-codex
```

The repository marketplace entry at `.agents/plugins/marketplace.json` points to that package path.

### Symlink Fallback

If your Codex setup uses native skill discovery directly, symlink the Codex-compatible skills directory:

```bash
mkdir -p ~/.agents/skills
ln -s ~/.codex/superpowers/plugins/sonbbal-superpowers-codex/skills ~/.agents/skills/sonbbal-superpowers-codex
```

Windows PowerShell:

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.agents\skills"
cmd /c mklink /J "$env:USERPROFILE\.agents\skills\sonbbal-superpowers-codex" "$env:USERPROFILE\.codex\superpowers\plugins\sonbbal-superpowers-codex\skills"
```

Restart Codex after installation so skills are rediscovered.

## Compatibility Tests

Run the Codex compatibility tests from the repository root:

```bash
bash tests/codex/run-tests.sh
```

The tests verify that:

- The Codex plugin metadata points at `./skills`.
- Required Codex-compatible skills are present.
- Skill frontmatter includes `name` and `description`.
- Codex skills do not contain unavailable operational tool references or model-tier names.

## Known Limitations

- Root `agents/`, `hooks/`, and Claude Code plugin files are not ported.
- Team-driven workflows use local checklists unless the user explicitly authorizes Codex delegation.
- There is no runtime bridge for other harness-specific team APIs.
