# Superpowers for Trae IDE

Complete guide for using Superpowers with [Trae IDE](https://www.trae.ai).

## Quick Install

Tell Trae's AI agent:

```text
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.trae/INSTALL.md
```

## Manual Installation

### Prerequisites

- [Trae IDE](https://www.trae.ai) installed
- Git installed

### macOS / Linux

```bash
# 1. Install Superpowers (or update existing)
if [ -d ~/.trae/superpowers ]; then
  cd ~/.trae/superpowers && git pull
else
  git clone https://github.com/obra/superpowers.git ~/.trae/superpowers
fi

# 2. Create skills directory
mkdir -p ~/.trae/skills

# 3. Remove old symlink if it exists (safe: fails loudly if it's a real directory)
if [ -L ~/.trae/skills/superpowers ]; then
  rm ~/.trae/skills/superpowers
elif [ -e ~/.trae/skills/superpowers ]; then
  echo "ERROR: ~/.trae/skills/superpowers exists and is not a symlink. Remove it manually." >&2
  exit 1
fi

# 4. Create symlink
ln -s ~/.trae/superpowers/skills ~/.trae/skills/superpowers

# 5. Restart Trae IDE
```

#### Verify Installation

```bash
ls -l ~/.trae/skills/superpowers
```

Should show a symlink pointing to `~/.trae/superpowers/skills`.

### Windows

**Prerequisites:**
- Git installed
- Either **Developer Mode** enabled OR **Administrator privileges**
  - Windows 10: Settings → Update & Security → For developers
  - Windows 11: Settings → System → For developers

#### PowerShell

Run as Administrator, or with Developer Mode enabled:

```powershell
# 1. Install Superpowers
git clone https://github.com/obra/superpowers.git "$env:USERPROFILE\.trae\superpowers"

# 2. Create skills directory
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.trae\skills"

# 3. Remove existing link (safe for reinstalls)
Remove-Item "$env:USERPROFILE\.trae\skills\superpowers" -Force -ErrorAction SilentlyContinue

# 4. Create skills junction (works without special privileges)
New-Item -ItemType Junction -Path "$env:USERPROFILE\.trae\skills\superpowers" -Target "$env:USERPROFILE\.trae\superpowers\skills"

# 5. Restart Trae IDE
```

#### Command Prompt

Run as Administrator, or with Developer Mode enabled:

```cmd
:: 1. Install Superpowers
git clone https://github.com/obra/superpowers.git "%USERPROFILE%\.trae\superpowers"

:: 2. Create skills directory
mkdir "%USERPROFILE%\.trae\skills" 2>nul

:: 3. Remove existing link (safe for reinstalls)
rmdir "%USERPROFILE%\.trae\skills\superpowers" 2>nul

:: 4. Create skills junction
mklink /J "%USERPROFILE%\.trae\skills\superpowers" "%USERPROFILE%\.trae\superpowers\skills"

:: 5. Restart Trae IDE
```

#### Verify Installation (Windows)

```powershell
Get-ChildItem "$env:USERPROFILE\.trae\skills" | Where-Object { $_.LinkType }
```

Look for `<JUNCTION>` in the output.

## Usage

### How Skills Are Discovered

Trae IDE natively scans `~/.trae/skills/` for skills at startup. Each skill's `SKILL.md` frontmatter is indexed, and Trae's AI activates skills based on context and descriptions.

The `using-superpowers` skill (description: *"Use when starting any conversation"*) guides the AI to check for relevant skills before every task.

### Loading Skills Explicitly

You can always request a skill directly:

```text
use the brainstorming skill
use the test-driven-development skill
use the systematic-debugging skill
```

### Personal Skills

Create your own skills in `~/.trae/skills/`:

```bash
mkdir -p ~/.trae/skills/my-skill
```

Create `~/.trae/skills/my-skill/SKILL.md`:

```markdown
---
name: my-skill
description: Use when [condition] - [what it does]
---

# My Skill

[Your skill content here]
```

### Project Skills

Create project-specific skills in `.trae/skills/` within your project:

```bash
mkdir -p .trae/skills/my-project-skill
```

**Skill Priority:** Project skills > Personal (global) skills > Superpowers skills

## Skill Locations

Trae IDE discovers skills from these locations (highest to lowest priority):

1. **Project skills** (`.trae/skills/`) — Highest priority
2. **Personal skills** (`~/.trae/skills/`)
3. **Superpowers skills** (`~/.trae/skills/superpowers/`) — via symlink

## Ensuring Bootstrap Context

For the best experience, add a User Rule in Trae IDE via **Settings > Rules & Skills > User Rules**:

```text
You have access to superpowers skills at ~/.trae/skills/superpowers/.
Before responding to any task, check if a relevant skill applies.
Read skill files from ~/.trae/skills/superpowers/{skill-name}/SKILL.md to load them.
Key skills: brainstorming, writing-plans, subagent-driven-development,
test-driven-development, systematic-debugging, requesting-code-review.
Follow the using-superpowers skill guidelines when deciding whether to invoke a skill.
```

This ensures the AI knows about superpowers in every conversation, even before it reads the `using-superpowers` skill.

## Features

### Native Skills Integration

Superpowers uses Trae's native skill discovery. The SKILL.md format used by superpowers matches Trae's expected format exactly — no conversion needed.

### Tool Mapping

Skills written for Claude Code use Claude Code tool names. In Trae IDE, use these equivalents:

| Claude Code Tool | Trae IDE Equivalent |
|-----------------|---------------------|
| `Skill` tool | Ask AI to read the SKILL.md file |
| `TodoWrite` | Trae's built-in task/plan features |
| `Task` with subagents | Trae's agent system |
| `Read`, `Write`, `Edit` | Trae's native file tools |
| `Bash` | Trae's terminal integration |

## Updating

```bash
cd ~/.trae/superpowers
git pull
```

Skills update instantly through the symlink. Restart Trae IDE to reload.

## Troubleshooting

### Skills not showing up

1. Verify symlink: `ls -la ~/.trae/skills/superpowers`
2. Check source exists: `ls ~/.trae/superpowers/skills`
3. Restart Trae IDE — skills are discovered at startup

### AI not invoking skills automatically

The `using-superpowers` skill guides the AI to check for skills before every task. If it's not triggering:

1. Explicitly say: `"use the using-superpowers skill"`
2. Add a User Rule (see [Ensuring Bootstrap Context](#ensuring-bootstrap-context))

### Windows junction issues

Junctions normally work without special permissions. If creation fails, try running PowerShell as Administrator.

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Main documentation: https://github.com/obra/superpowers
- Trae IDE docs: https://docs.trae.ai
