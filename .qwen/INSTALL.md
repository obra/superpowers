# Installing Superpowers for Qwen Code

## Prerequisites

- [Qwen Code](https://qwenlm.github.io/) installed
- Git

## Installation

### Step 1: Clone the repo

```bash
git clone https://github.com/obra/superpowers.git ~/.qwen/superpowers
```

### Step 2: Create the skills symlink

Qwen Code scans `~/.qwen/skills/` at startup for skill discovery:

```bash
mkdir -p ~/.qwen/skills
ln -s ~/.qwen/superpowers/skills ~/.qwen/skills/superpowers
```

### Step 3: Restart Qwen

Skills are discovered at startup. Restart your Qwen Code session.

### Verify Installation

Start a new session and ask: "Tell me about your superpowers"

Or try something that should trigger a skill, like "help me plan this feature" — the brainstorming skill should activate automatically.

## Windows

Use a junction instead of a symlink (works without Developer Mode):

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.qwen\skills"
cmd /c mklink /J "$env:USERPROFILE\.qwen\skills\superpowers" "$env:USERPROFILE\.qwen\superpowers\skills"
```

## Updating

```bash
cd ~/.qwen/superpowers && git pull
```

Skills update instantly through the symlink.

## Uninstalling

```bash
rm ~/.qwen/skills/superpowers
```

**Windows (PowerShell):**
```powershell
Remove-Item "$env:USERPROFILE\.qwen\skills\superpowers"
```

Optionally delete the clone: `rm -rf ~/.qwen/superpowers`

## How It Works

Qwen Code has native skill discovery — it scans `~/.qwen/skills/` at startup, parses SKILL.md frontmatter, and loads skills on demand. Superpowers skills are made visible through a single symlink:

```
~/.qwen/skills/superpowers/ → ~/.qwen/superpowers/skills/
```

The `using-superpowers` skill is discovered automatically and enforces skill usage discipline — no additional configuration needed.

## Usage

Skills are discovered automatically. Qwen activates them when:
- You mention a skill by name (e.g., "use brainstorming")
- The task matches a skill's description
- The `using-superpowers` skill directs Qwen to use one

### Personal Skills

Create your own skills in `~/.qwen/skills/`:

```bash
mkdir -p ~/.qwen/skills/my-skill
```

Create `~/.qwen/skills/my-skill/SKILL.md`:

```markdown
---
name: my-skill
description: Use when [condition] - [what it does]
---

# My Skill

[Your skill content here]
```

The `description` field is how Qwen decides when to activate a skill automatically — write it as a clear trigger condition.

## Troubleshooting

### Skills not showing up

1. Verify the symlink: `ls -la ~/.qwen/skills/superpowers`
2. Check skills exist: `ls ~/.qwen/superpowers/skills`
3. Restart Qwen — skills are discovered at startup

### Windows junction issues

Junctions normally work without special permissions. If creation fails, try running PowerShell as administrator.

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Full documentation: https://github.com/obra/superpowers/blob/main/docs/README.Qwen.md
