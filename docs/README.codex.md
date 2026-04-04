# Superpowers for Codex

This guide explains how to install and use the Codex-only Superpowers fork.

## Quick Install

Tell Codex:

```text
Fetch and follow instructions from https://raw.githubusercontent.com/Jo-Atom/superpowers-codex/refs/heads/main/.codex/INSTALL.md
```

## Manual Install

### Prerequisites

- Codex CLI
- macOS, Linux, or WSL with a POSIX shell
- Git

### Steps

1. Clone the repository:

   ```bash
   git clone https://github.com/Jo-Atom/superpowers-codex.git "${CODEX_HOME:-$HOME/.codex}/superpowers"
   ```

2. Create the global skills symlink:

   ```bash
   mkdir -p "$HOME/.agents/skills"
   ln -s "${CODEX_HOME:-$HOME/.codex}/superpowers/skills" "$HOME/.agents/skills/superpowers"
   ```

3. Restart Codex.

These commands assume a POSIX shell and default `CODEX_HOME` to `~/.codex` when it is unset. If you are on native Windows, use WSL or translate the commands manually.

## How It Works

- Codex reads `AGENTS.md` for repository instructions.
- Codex discovers personal skills from `$HOME/.agents/skills`.
- Superpowers adds workflow discipline on top of Codex-native skills and multi-agent tools.

## Codex CLI vs Codex App

- CLI is the primary supported surface in this fork.
- App compatibility is best-effort and intentionally secondary.
- If a workflow behaves differently in App, prefer the CLI interpretation unless a skill explicitly documents the App caveat.

## Updating

```bash
cd "${CODEX_HOME:-$HOME/.codex}/superpowers" && git pull
```

## Uninstalling

```bash
rm "$HOME/.agents/skills/superpowers"
rm -rf "${CODEX_HOME:-$HOME/.codex}/superpowers"
```

## Troubleshooting

### Skills do not appear

```bash
ls -la "$HOME/.agents/skills/superpowers"
ls "${CODEX_HOME:-$HOME/.codex}/superpowers/skills"
```

### Instructions look stale

Restart Codex. `AGENTS.md` and skill discovery are evaluated when a session starts.

## Validation

See `docs/testing.md` for the Codex-only validation steps.
