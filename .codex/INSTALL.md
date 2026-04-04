# Installing Superpowers for Codex

Install the Codex-only Superpowers fork by cloning it locally and using Codex's repo-local skill discovery.

These commands assume macOS, Linux, or WSL with a POSIX shell, and default `CODEX_HOME` to `~/.codex` when it is unset.

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/Jo-Atom/superpowers-codex.git "${CODEX_HOME:-$HOME/.codex}/superpowers"
   ```

2. Verify the cloned repository exposes `.agents/skills`:

   ```bash
   ls -ld "${CODEX_HOME:-$HOME/.codex}/superpowers/.agents/skills"
   test -f "${CODEX_HOME:-$HOME/.codex}/superpowers/.agents/skills/using-superpowers/SKILL.md"
   ```

3. Start Codex from the repository root:

   ```bash
   cd "${CODEX_HOME:-$HOME/.codex}/superpowers"
   codex
   ```

4. Restart Codex if it was already open before you cloned the repository.

This fork uses repo-local `.agents/skills` discovery. Personal Codex skills still live in `$HOME/.agents/skills`.

## Verify

```bash
ls -ld "${CODEX_HOME:-$HOME/.codex}/superpowers/.agents/skills"
test -f "${CODEX_HOME:-$HOME/.codex}/superpowers/.agents/skills/using-superpowers/SKILL.md"
```

Expected: the `.agents/skills` path exists and exposes the repository's skill directories.
