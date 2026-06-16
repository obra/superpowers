# Superpowers for Mistral Vibe

Guide for using Superpowers with Mistral Vibe via skill path configuration.

## Quick Install

1. Clone the repo:
   ```bash
   git clone https://github.com/obra/superpowers.git ~/.superpowers
   ```

2. Add the skills path to your Vibe config (`~/.vibe/config.toml`):
   ```toml
   skill_paths = ["~/.superpowers/skills"]
   ```

3. Restart Vibe.

## How It Works

Mistral Vibe discovers skills by scanning directories listed in `skill_paths`. Each directory is checked for subdirectories containing a `SKILL.md` file. Adding the superpowers skills path makes all skills available via Vibe's native `skill` tool.

The `using-superpowers` skill is discovered automatically and enforces skill usage discipline — no additional configuration needed.

## Context File

Copy `VIBE.md` from the superpowers repo to your project root to load the tool mapping automatically:

```bash
cp ~/.superpowers/VIBE.md /path/to/your/project/VIBE.md
```

This maps Claude Code tool names used in skills to their Mistral Vibe equivalents.

## Usage

Skills are discovered automatically. Vibe activates them when:
- You mention a skill by name (e.g., "use brainstorming")
- The task matches a skill's description
- The `using-superpowers` skill directs Vibe to use one

### Personal Skills

Create your own skills in `~/.vibe/skills/`:

```bash
mkdir -p ~/.vibe/skills/my-skill
```

Create `~/.vibe/skills/my-skill/SKILL.md`:

```markdown
---
name: my-skill
description: Use when [condition] - [what it does]
---

# My Skill

[Your skill content here]
```

The `description` field is how Vibe decides when to activate a skill automatically — write it as a clear trigger condition.

## Updating

```bash
cd ~/.superpowers && git pull
```

Skills update instantly through the configured path.

## Uninstalling

Remove the skills path from `~/.vibe/config.toml`:

```toml
skill_paths = []
```

Optionally delete the clone: `rm -rf ~/.superpowers`.

## Troubleshooting

### Skills not showing up

1. Verify the path in config: `grep skill_paths ~/.vibe/config.toml`
2. Check skills exist: `ls ~/.superpowers/skills`
3. Restart Vibe — skills are discovered at startup

### Tool mapping not loaded

Copy `VIBE.md` to your project root. Vibe reads `AGENTS.md` files from `.vibe/` directories, but the tool mapping in `VIBE.md` must be placed where Vibe can discover it.

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Main documentation: https://github.com/obra/superpowers
