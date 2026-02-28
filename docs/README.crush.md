# Superpowers for Crush

Complete guide for using Superpowers with [Crush](https://github.com/charmbracelet/crush) — the terminal AI coding agent from Charmbracelet.

## Quick Install

Tell Crush:

```
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.crush/INSTALL.md
```

## Manual Installation

### Prerequisites

- [Crush](https://github.com/charmbracelet/crush) installed
- Git installed

### macOS / Linux

```bash
# 1. Install Superpowers (or update existing)
if [ -d ~/.config/crush/superpowers ]; then
  cd ~/.config/crush/superpowers && git pull
else
  git clone https://github.com/obra/superpowers.git ~/.config/crush/superpowers
fi

# 2. Create skills directory
mkdir -p ~/.config/crush/skills

# 3. Remove old symlink if it exists
rm -rf ~/.config/crush/skills/superpowers

# 4. Create symlink
ln -s ~/.config/crush/superpowers/skills ~/.config/crush/skills/superpowers
```

#### Verify Installation

```bash
ls -l ~/.config/crush/skills/superpowers
```

The symlink should point to your superpowers `skills/` directory.

### Windows

**Prerequisites:**
- Git installed
- Either **Developer Mode** enabled OR **Administrator privileges**
  - Windows 10: Settings → Update & Security → For developers
  - Windows 11: Settings → System → For developers

#### PowerShell

Run as Administrator, or with Developer Mode enabled:

```powershell
$crush = "$env:LOCALAPPDATA\crush"

# 1. Install Superpowers
git clone https://github.com/obra/superpowers.git "$crush\superpowers"

# 2. Create skills directory
New-Item -ItemType Directory -Force -Path "$crush\skills"

# 3. Remove existing junction
Remove-Item "$crush\skills\superpowers" -Force -ErrorAction SilentlyContinue

# 4. Create junction (works without special privileges)
New-Item -ItemType Junction -Path "$crush\skills\superpowers" `
  -Target "$crush\superpowers\skills"
```

#### Verify Installation

```powershell
Get-ChildItem "$env:LOCALAPPDATA\crush\skills" | Where-Object { $_.LinkType }
```

Look for `<JUNCTION>` pointing to the superpowers skills directory.

#### Troubleshooting Windows

**"You do not have sufficient privilege" error:**
- Enable Developer Mode in Windows Settings, OR
- Right-click your terminal → "Run as Administrator"

---

## How It Works

### Skills Discovery

Crush natively discovers skills from `~/.config/crush/skills/` on macOS/Linux
(`%LOCALAPPDATA%\crush\skills\` on Windows). Superpowers skills are made accessible
via a symlink:

```
~/.config/crush/skills/superpowers/ → ~/.config/crush/superpowers/skills/
```

Crush also checks `~/.config/agents/skills/` (a cross-agent shared path) and any
paths listed in `options.skills_paths` in your `crush.json`.

### Skill Activation

At the start of each session, Crush scans all skill directories and injects discovered
skills into the system prompt as `<available_skills>` XML. Each entry includes the
skill's `name`, `description`, and file `location`.

Crush reads the full `SKILL.md` file when a task matches a skill's description. The
`using-superpowers` skill (description: "Use when starting any conversation") ensures
skill discipline is established at the start of every session.

### Tool Mapping

Skills were originally written for Claude Code. In Crush, substitute:

| Claude Code Tool | Crush Equivalent |
|---|---|
| `TodoWrite` | Create a task list or todo file |
| `Task` with subagents | Use Crush's Agent tool for complex subtasks |
| `Skill` tool | Read the skill file at the `<location>` path from `<available_skills>` |
| `Read`, `Write`, `Edit`, `Bash` | Your native Crush tools |

---

## Usage

### Finding Skills

Skills appear in `<available_skills>` in Crush's context at the start of each session.
Superpowers skills appear under the `superpowers/` namespace in the file path.

### Loading a Skill

Ask Crush to use a skill by name, for example:

```
use the brainstorming skill
```

Or just describe what you want to do — Crush matches the task to the right skill
automatically based on skill descriptions.

### Personal Skills

Create your own skills in `~/.config/crush/skills/`:

```bash
mkdir -p ~/.config/crush/skills/my-skill
```

Create `~/.config/crush/skills/my-skill/SKILL.md`:

```markdown
---
name: my-skill
description: Use when [condition] - [what it does]
---

# My Skill

[Your skill content here]
```

> **Note:** The `name` field in the frontmatter must match the directory name exactly
> (case-insensitive). A skill named `my-skill` must live in a `my-skill/` directory.

### Project Skills

Add a `skills_paths` entry to your project's `crush.json` or `.crush.json`:

```json
{
  "options": {
    "skills_paths": [".crush-skills"]
  }
}
```

Then create `.crush-skills/my-project-skill/SKILL.md` in your project root.

## Skill Locations

Crush discovers skills in this priority order:

1. **Project skills** (via `crush.json` `options.skills_paths`) — Highest priority
2. **Personal skills** (`~/.config/crush/skills/`)
3. **Superpowers skills** (`~/.config/crush/skills/superpowers/`) — via symlink

You can also override the default discovery directory entirely with `CRUSH_SKILLS_DIR`:

```bash
export CRUSH_SKILLS_DIR=~/.config/crush/skills
```

---

## Updating

```bash
cd ~/.config/crush/superpowers
git pull
```

Skills update instantly through the symlink. Restart Crush to pick up any changes.

## Uninstalling

```bash
rm ~/.config/crush/skills/superpowers
rm -rf ~/.config/crush/superpowers
```

---

## Troubleshooting

### Skills not found

1. Verify the symlink: `ls -la ~/.config/crush/skills/superpowers`
2. Check target resolves: `ls ~/.config/crush/superpowers/skills/`
3. Restart Crush — skills are discovered at startup
4. Check override: ensure `CRUSH_SKILLS_DIR` is not set to a different path

### Custom skills directory

To override the default path, set `CRUSH_SKILLS_DIR`:

```bash
export CRUSH_SKILLS_DIR=/path/to/your/skills
```

Or add additional paths without overriding the default using `options.skills_paths` in
`~/.config/crush/crush.json`.

### Windows junction issues

Junctions normally work without special permissions. If creation fails, try running
PowerShell as administrator.

---

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Main documentation: https://github.com/obra/superpowers
- Crush docs: https://github.com/charmbracelet/crush
