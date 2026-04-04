# Installing Superpowers for Codex

Install the Codex-only Superpowers fork by cloning it locally and linking its skills into Codex's global skill directory.

These commands assume macOS, Linux, or WSL with a POSIX shell, and default `CODEX_HOME` to `~/.codex` when it is unset.

## Installation

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

## Verify

```bash
ls -la "$HOME/.agents/skills/superpowers"
ls "${CODEX_HOME:-$HOME/.codex}/superpowers/skills"
```

Expected: `~/.agents/skills/superpowers` is a symlink pointing at the repository's `skills/` directory.
