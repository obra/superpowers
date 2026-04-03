# Installing Superpowers for Codex

Install the Codex-only Superpowers fork by cloning it locally and exposing the skills to Codex.

These commands assume macOS, Linux, or WSL with a POSIX shell, and default `CODEX_HOME` to `~/.codex` when it is unset.

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/Jo-Atom/superpowers-codex.git "${CODEX_HOME:-$HOME/.codex}/superpowers"
   ```

2. Link the skills into Codex's user skill directory:

   ```bash
   mkdir -p "${CODEX_HOME:-$HOME/.codex}/skills"
   ln -s "${CODEX_HOME:-$HOME/.codex}/superpowers/skills" "${CODEX_HOME:-$HOME/.codex}/skills/superpowers"
   ```

3. Restart Codex.

## Verify

```bash
ls -la "${CODEX_HOME:-$HOME/.codex}/skills/superpowers"
```

Expected: a symlink pointing at `${CODEX_HOME:-$HOME/.codex}/superpowers/skills`
