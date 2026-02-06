# Installing Superpowers for Codex

Quick setup to enable superpowers skills in Codex. The installer links your skills into Codex's native discovery path so they load automatically.

## Prerequisites

- [Node.js](https://nodejs.org/) (v16+)
- Git

## Installation

1. **Clone superpowers repository**:
   ```bash
   git clone https://github.com/obra/superpowers.git ~/.codex/superpowers
   ```

2. **Run the installer**:
   ```bash
   node ~/.codex/superpowers/.codex/install-codex.mjs
   ```

3. **Restart Codex** (quit and relaunch the CLI) to discover the skills.

**Windows:** The installer creates a junction (`mklink /J`), which works without Developer Mode.

## What the installer does

- Links `~/.agents/skills/superpowers` → `~/.codex/superpowers/skills` (symlink on macOS/Linux, junction on Windows)
- Adds a gatekeeper block to `~/.codex/AGENTS.md` that tells Codex to use superpowers skills
- If you had the old bootstrap setup, it removes it automatically

## Verify

```bash
ls -la ~/.agents/skills/superpowers
```

You should see a symlink (or junction) pointing to your superpowers skills directory.

## Updating

```bash
cd ~/.codex/superpowers && git pull
```

Skills update instantly through the link.

## Uninstalling

```bash
rm ~/.agents/skills/superpowers
```

Then remove the block between `<!-- superpowers:begin -->` and `<!-- superpowers:end -->` from `~/.codex/AGENTS.md`. Optionally delete the clone: `rm -rf ~/.codex/superpowers`.
