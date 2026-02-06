# Superpowers for Codex

Guide for using Superpowers with OpenAI Codex via native skill discovery.

## Quick Install

Tell Codex:

```
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.codex/INSTALL.md
```

## Manual Installation

### Prerequisites

- OpenAI Codex CLI
- Node.js (for the installer script)

### Steps

1. Clone the repo:
   ```bash
   git clone https://github.com/obra/superpowers.git ~/.codex/superpowers
   ```

2. Run the installer:
   ```bash
   node ~/.codex/superpowers/.codex/install-codex.mjs
   ```

3. Restart Codex.

The installer creates a symlink from `~/.agents/skills/superpowers` to the repo's `skills/` directory and adds a gatekeeper block to `~/.codex/AGENTS.md`. Existing users with the old bootstrap setup are migrated automatically.

### Windows

The installer tries symlinks first, then falls back to junctions (`mklink /J`) if symlinks require Developer Mode. Both work for Codex skill discovery.

## How It Works

Codex has native skill discovery — it scans `~/.agents/skills/` at startup, parses SKILL.md frontmatter, and loads skills on demand. Superpowers skills are made visible through a single symlink:

```
~/.agents/skills/superpowers/ → ~/.codex/superpowers/skills/
```

A small gatekeeper block in `~/.codex/AGENTS.md` ensures Codex invokes `$using-superpowers` at session start, which enforces skill usage discipline across turns.

## Usage

Skills are discovered automatically. Codex activates them when:
- You mention a skill by name (e.g., "use brainstorming")
- The task matches a skill's description
- The `using-superpowers` skill directs Codex to use one

### Tool Mappings

Skills written for Claude Code reference tools that have Codex equivalents:

| Claude Code | Codex |
|-------------|-------|
| `TodoWrite` | `update_plan` |
| `Task`/`Subagent` | `spawn_agent` + `wait` (or sequential if collab disabled) |
| `Skill` tool | Native `$skill-name` mention |
| `Read`, `Write`, `Edit`, `Bash` | Native equivalents |

These mappings are included in the AGENTS.md gatekeeper block.

### Personal Skills

Create your own skills in `~/.agents/skills/`:

```bash
mkdir -p ~/.agents/skills/my-skill
```

Create `~/.agents/skills/my-skill/SKILL.md`:

```markdown
---
name: my-skill
description: Use when [condition] - [what it does]
---

# My Skill

[Your skill content here]
```

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

## Troubleshooting

### Skills not showing up

1. Verify the symlink: `ls -la ~/.agents/skills/superpowers`
2. Check skills exist: `ls ~/.codex/superpowers/skills`
3. Restart Codex — skills are discovered at startup

### Windows symlink issues

If the installer reports symlink failure, ensure Developer Mode is enabled or run as administrator. The installer will attempt a junction fallback automatically.

### Node.js not found

The installer requires Node.js. Verify:

```bash
node --version
```

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Main documentation: https://github.com/obra/superpowers
