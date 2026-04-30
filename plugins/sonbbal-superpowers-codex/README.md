# Sonbbal Superpowers for Codex

Codex-focused Superpowers plugin package.

This package is intentionally separate from the root Claude Code package so each harness can keep idiomatic instructions:

- Claude Code package: repository root, `.claude-plugin/`, `hooks/`, root `skills/`
- Codex package: `plugins/sonbbal-superpowers-codex/`

## What This Package Contains

Phase 1 provides a minimal Codex-compatible skill set:

- `using-superpowers`
- `verification-before-completion`
- `test-driven-development`
- `writing-plans`
- `executing-plans`
- `team-driven-development`
- `model-assignment`

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
- Required Phase 1 skills are present.
- Skill frontmatter includes `name` and `description`.
- Codex skills do not contain unavailable operational tool references or model-tier names.

## Known Limitations

Phase 1 is a compatibility baseline, not full parity with every root Superpowers skill.

Current limitations:

- Only the Phase 1 skill set is included.
- Root `agents/`, `hooks/`, and Claude Code plugin files are not ported.
- Team-driven workflows use local checklists unless the user explicitly authorizes Codex delegation.
- There is no runtime bridge for other harness-specific team APIs.
