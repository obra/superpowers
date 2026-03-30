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
- Git

### Steps

1. Clone the repo:
   ```bash
   git clone https://github.com/obra/superpowers.git ~/.codex/superpowers
   ```

2. Create the skills symlink:
   ```bash
   mkdir -p ~/.agents/skills
   ln -s ~/.codex/superpowers/skills ~/.agents/skills/superpowers
   ```

3. Create the agents symlink:
   ```bash
   mkdir -p ~/.codex/agents
   ln -s ~/.codex/superpowers/.codex/agents ~/.codex/agents/superpowers
   ```

4. Restart Codex.

### Windows

Use junctions instead of symlinks (works without Developer Mode):

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.agents\skills"
cmd /c mklink /J "$env:USERPROFILE\.agents\skills\superpowers" "$env:USERPROFILE\.codex\superpowers\skills"
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.codex\agents"
cmd /c mklink /J "$env:USERPROFILE\.codex\agents\superpowers" "$env:USERPROFILE\.codex\superpowers\.codex\agents"
```

## How It Works

Codex loads two Superpowers integration surfaces at startup:

```
~/.agents/skills/superpowers/ -> ~/.codex/superpowers/skills/
~/.codex/agents/superpowers/ -> ~/.codex/superpowers/.codex/agents/
```

- the skills directory exposes SKILL.md files for native skill discovery
- the agents directory exposes native Codex reviewer roles such as `superpowers_reviewer` and `superpowers_spec_reviewer`

The `using-superpowers` skill is discovered automatically and enforces skill usage discipline. When subagent workflows need specialized reviewers on Codex, Superpowers can now use native `superpowers_*` roles instead of treating `worker` plus inline prompts as the primary design.

## Usage

Skills are discovered automatically. Codex activates them when:
- You mention a skill by name (e.g., "use brainstorming")
- The task matches a skill's description
- The `using-superpowers` skill directs Codex to use one

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

The `description` field is how Codex decides when to activate a skill automatically - write it as a clear trigger condition.

## Updating

```bash
cd ~/.codex/superpowers && git pull
```

Skills and agents update through the symlinks after you restart Codex.

## Uninstalling

```bash
rm ~/.agents/skills/superpowers
rm ~/.codex/agents/superpowers
```

**Windows (PowerShell):**
```powershell
Remove-Item "$env:USERPROFILE\.agents\skills\superpowers"
Remove-Item "$env:USERPROFILE\.codex\agents\superpowers"
```

Optionally delete the clone: `rm -rf ~/.codex/superpowers` (Windows: `Remove-Item -Recurse -Force "$env:USERPROFILE\.codex\superpowers"`).

## Troubleshooting

### Skills not showing up

1. Verify the symlink: `ls -la ~/.agents/skills/superpowers`
2. Check skills exist: `find ~/.codex/superpowers/skills -maxdepth 2 -name SKILL.md | head`
3. Restart Codex - skills are discovered at startup

### Agents not showing up

1. Verify the symlink: `ls -la ~/.codex/agents/superpowers`
2. Check TOMLs exist: `find ~/.codex/agents/superpowers -maxdepth 1 -name '*.toml' | sort`
3. Restart Codex - agent roles are loaded at startup

### Windows junction issues

Junctions normally work without special permissions. If creation fails, try running PowerShell as administrator.

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Main documentation: https://github.com/obra/superpowers
