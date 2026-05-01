# Sonbbal Superpowers for Claude Code

Claude Code package for Sonbbal Superpowers.

This package is intentionally separate from the Codex package so Claude Code can keep Claude-native skills, agents, commands, and hooks without mixing in Codex-specific instructions.

## What This Package Contains

- `.claude-plugin/plugin.json`: Claude Code plugin metadata.
- `skills/`: Claude Code Superpowers skills.
- `agents/`: Claude Code agent definitions.
- `commands/`: User-facing slash command redirects.
- `hooks/`: Session and task hooks used by the plugin.

## Package Boundary

The repository root is not the Claude Code runtime package. The root marketplace file points Claude Code at this directory:

```text
claude-code/
```

Codex uses the separate package at:

```text
codex/
```

## Installation

See [INSTALL.md](INSTALL.md).

Quick install from Claude Code:

```text
/plugin marketplace add Sonbbal/superpowers
/plugin install sonbbal-superpowers@sonbbal-marketplace
```

After installing or updating, restart Claude Code or start a new session so skills, commands, agents, and hooks are rediscovered.

## Updating

```text
/plugin update sonbbal-superpowers
```

If an update does not pick up the package move, uninstall and reinstall from the same marketplace.

## Verification

Run the package-layout check from the repository root:

```bash
bash tests/claude-code/test-plugin-package.sh
```

Run the fast Claude Code test runner:

```bash
bash tests/claude-code/run-skill-tests.sh --test test-plugin-package.sh
```

Full integration tests require the Claude Code CLI and can take 10-30 minutes.
