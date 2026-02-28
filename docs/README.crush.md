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

# 5. Append bootstrap to global AGENTS.md
mkdir -p ~/.config/crush
cat ~/.config/crush/superpowers/.crush/AGENTS.md >> ~/.config/crush/AGENTS.md
```

#### Verify Installation

```bash
ls -l ~/.config/crush/skills/superpowers
grep -c superpowers ~/.config/crush/AGENTS.md
```

The symlink should point to your superpowers `skills/` directory, and the AGENTS.md grep should return a non-zero count.

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

# 5. Append bootstrap to global AGENTS.md
New-Item -ItemType Directory -Force -Path $crush
Get-Content "$crush\superpowers\.crush\AGENTS.md" | Add-Content "$crush\AGENTS.md"
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

### Bootstrap Injection

Crush reads `~/.config/crush/AGENTS.md` automatically at session start. The
superpowers bootstrap snippet (from `.crush/AGENTS.md`) is appended once
during installation, injecting persistent context about the skills system and tool
mappings into every Crush session.

### Tool Mapping

Skills were originally written for Claude Code. The bootstrap provides mappings:

| Claude Code Tool | Crush Equivalent |
|---|---|
| `TodoWrite` | Create a task list or todo file |
| `Task` with subagents | Crush's native parallel execution |
| `Skill` tool | Crush's native skill tool |
| `Read`, `Write`, `Edit`, `Bash` | Your native Crush tools |

---

## Usage

### Finding Skills

Use Crush's native skill tool to list all available skills. Superpowers skills appear
under the `superpowers/` namespace.

### Loading a Skill

```
load skill superpowers/brainstorming
```

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

1. **Project skills** (via `crush.json` `skills_paths`) — Highest priority
2. **Personal skills** (`~/.config/crush/skills/`)
3. **Superpowers skills** (`~/.config/crush/skills/superpowers/`) — via symlink

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

Remove the superpowers block from `~/.config/crush/AGENTS.md` manually (it begins
with `# Superpowers` and ends before any other sections you may have added).

---

## Troubleshooting

### Skills not found

1. Verify the symlink: `ls -la ~/.config/crush/skills/superpowers`
2. Check target resolves: `ls ~/.config/crush/superpowers/skills/`
3. Restart Crush — skills are discovered at startup

### Bootstrap not active

1. Check: `cat ~/.config/crush/AGENTS.md | grep -i superpowers`
2. Re-run the bootstrap append (Step 5 in installation)
3. Ensure you're not accidentally overwriting `AGENTS.md` on each launch

### Windows junction issues

Junctions normally work without special permissions. If creation fails, try running
PowerShell as administrator.

---

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Main documentation: https://github.com/obra/superpowers
- Crush docs: https://github.com/charmbracelet/crush
