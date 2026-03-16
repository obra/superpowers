# Superpowers for OpenClaw

Guide for using Superpowers with [OpenClaw](https://github.com/openclaw/openclaw) via native skill discovery.

## Quick Install

Tell your OpenClaw agent:

```
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.openclaw/INSTALL.md
```

## Manual Installation

### Prerequisites

- OpenClaw installed and running
- Git

### Steps

1. Clone the repo:
   ```bash
   git clone https://github.com/obra/superpowers.git ~/.openclaw/superpowers
   ```

2. Create the skills symlink:
   ```bash
   mkdir -p ~/.openclaw/workspace/.agents/skills
   ln -s ~/.openclaw/superpowers/skills ~/.openclaw/workspace/.agents/skills/superpowers
   ```

3. Restart OpenClaw (`openclaw gateway restart`) to discover the skills.

### Windows

Use a junction instead of a symlink (works without Developer Mode):

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.openclaw\workspace\.agents\skills"
cmd /c mklink /J "$env:USERPROFILE\.openclaw\workspace\.agents\skills\superpowers" "$env:USERPROFILE\.openclaw\superpowers\skills"
```

## How It Works

OpenClaw has native skill discovery — it scans `~/.openclaw/workspace/.agents/skills/` at startup, parses SKILL.md frontmatter (`name` and `description`), and loads skills on demand. Superpowers skills are made visible through a single symlink:

```
~/.openclaw/workspace/.agents/skills/superpowers/ → ~/.openclaw/superpowers/skills/
```

The `using-superpowers` skill is discovered automatically and enforces skill usage discipline — no additional configuration needed.

## Usage

Skills are discovered automatically. OpenClaw activates them when:
- You mention a skill by name (e.g., "use brainstorming")
- The task matches a skill's description
- The `using-superpowers` skill directs the agent to use one

### Personal Skills

Create your own skills in `~/.openclaw/workspace/.agents/skills/`:

```bash
mkdir -p ~/.openclaw/workspace/.agents/skills/my-skill
```

Create `~/.openclaw/workspace/.agents/skills/my-skill/SKILL.md`:

```markdown
---
name: my-skill
description: Use when [condition] - [what it does]
---

# My Skill

[Your skill content here]
```

The `description` field is how OpenClaw decides when to activate a skill automatically — write it as a clear trigger condition.

### Subagent Skills

Skills like `dispatching-parallel-agents` and `subagent-driven-development` use subagents. OpenClaw supports this natively via `sessions_spawn`. No additional configuration is needed.

### Tool Mapping

When skills reference Claude Code tools:
- `Task` with subagents → OpenClaw's `sessions_spawn`
- `TodoWrite` → task tracking in your workflow
- File operations → OpenClaw's native `read`/`write`/`edit` tools

## Updating

```bash
cd ~/.openclaw/superpowers && git pull
```

Skills update instantly through the symlink.

## Uninstalling

```bash
rm ~/.openclaw/workspace/.agents/skills/superpowers
```

Optionally delete the clone: `rm -rf ~/.openclaw/superpowers`.

## Troubleshooting

### Skills not showing up

1. Verify the symlink: `ls -la ~/.openclaw/workspace/.agents/skills/superpowers`
2. Check skills exist: `ls ~/.openclaw/superpowers/skills`
3. Restart OpenClaw — `openclaw gateway restart`

### Windows junction issues

Junctions normally work without special permissions. If creation fails, try running PowerShell as administrator.

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Main documentation: https://github.com/obra/superpowers
