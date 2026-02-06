# Installing Superpowers for Codex

Quick setup to enable superpowers skills in Codex via native skill discovery.

## Installation

1. **Clone superpowers repository**:
   ```bash
   git clone https://github.com/obra/superpowers.git ~/.codex/superpowers
   ```

2. **Run the installer**:
   ```bash
   node ~/.codex/superpowers/.codex/install-codex.mjs
   ```

3. **Restart Codex** to discover the skills.

## What the installer does

- Creates a symlink: `~/.agents/skills/superpowers` → `~/.codex/superpowers/skills`
- Adds a small gatekeeper block to `~/.codex/AGENTS.md`
- If you had the old bootstrap setup, it removes it automatically

## Updating

```bash
cd ~/.codex/superpowers && git pull
```

Skills update instantly through the symlink.

## Uninstalling

```bash
rm ~/.agents/skills/superpowers
```

Then remove the block between `<!-- superpowers:begin -->` and `<!-- superpowers:end -->` from `~/.codex/AGENTS.md`.
