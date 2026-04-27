# Installing Horspowers for Codex

Enable Horspowers in Codex via native skill discovery. The old bootstrap CLI is
still shipped for compatibility, but it is no longer the recommended path.

## Prerequisites

- Git
- Codex with native skills support

## Installation

1. **Clone the Horspowers repository:**
   ```bash
   git clone https://github.com/LouisHors/horspowers.git ~/.codex/horspowers
   ```

2. **Expose Horspowers skills to Codex:**
   ```bash
   mkdir -p ~/.agents/skills
   ln -s ~/.codex/horspowers/skills ~/.agents/skills/horspowers
   ```

   **Windows (PowerShell):**
   ```powershell
   New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.agents\skills"
   cmd /c mklink /J "$env:USERPROFILE\.agents\skills\horspowers" "$env:USERPROFILE\.codex\horspowers\skills"
   ```

3. **Restart Codex** so it re-scans `~/.agents/skills/`.

## Verify

```bash
ls -la ~/.agents/skills/horspowers
```

You should see a symlink or junction pointing to your cloned Horspowers
repository.

## Migrating from the old bootstrap flow

If you previously installed Horspowers through `AGENTS.md` and the bootstrap
script:

1. Update the repo:
   ```bash
   cd ~/.codex/horspowers && git pull
   ```

2. Create the `~/.agents/skills/horspowers` symlink or junction using the steps
   above.

3. Restart Codex.

4. The old bootstrap block in `~/.codex/AGENTS.md` can remain temporarily, but
   it is no longer required once native discovery is working.

## Legacy compatibility

This repository still ships `.codex/superpowers-codex` and
`.codex/superpowers-bootstrap.md` for migration and compatibility scenarios.
They should be treated as fallback tools, not the primary installation path.

## Updating

```bash
cd ~/.codex/horspowers && git pull
```

Skills update instantly through the symlink. Restart Codex if it already had an
active session open.

## Upstream Project

Horspowers is a fork of [obra/superpowers](https://github.com/obra/superpowers)
with Chinese localization and local workflow extensions. Report fork-specific
issues at [LouisHors/horspowers](https://github.com/LouisHors/horspowers/issues).
