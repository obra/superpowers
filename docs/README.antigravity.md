# Superpowers for Antigravity IDE

Guide for using Superpowers with Antigravity IDE via native skill discovery.

## Quick Install

Tell Antigravity:

```text
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.antigravity/INSTALL.md
```

## Manual Installation

### Prerequisites

- Antigravity IDE
- Git

### Steps

1. Clone the repo:

   **Linux/macOS:**
   ```bash
   git clone https://github.com/obra/superpowers.git ~/.gemini/antigravity/superpowers
   ```

   **Windows (PowerShell):**
   ```powershell
   git clone https://github.com/obra/superpowers.git "$env:USERPROFILE\.gemini\antigravity\superpowers"
   ```

2. Create the skills symlink:

   **Linux/macOS:**
   ```bash
   mkdir -p ~/.gemini/antigravity/skills
   ln -s ~/.gemini/antigravity/superpowers/skills ~/.gemini/antigravity/skills/superpowers
   ```

   **Windows (PowerShell):**
   ```powershell
   New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.gemini\antigravity\skills"
   cmd /c mklink /J "$env:USERPROFILE\.gemini\antigravity\skills\superpowers" "$env:USERPROFILE\.gemini\antigravity\superpowers\skills"
   ```

3. Configure bootstrap — create or edit `~/.gemini/GEMINI.md` (Linux/macOS) or `%USERPROFILE%\.gemini\GEMINI.md` (Windows), then add:

   ```markdown
   ## Superpowers

   You have superpowers. Use the **using-superpowers** skill before any task.
   ```

4. Restart Antigravity.

### Windows Notes

- Junctions (`mklink /J`) work without special permissions
- If symlink creation fails, try running PowerShell as administrator
- WSL users should follow the Linux/macOS instructions instead

## How It Works

Antigravity has native skill discovery — it scans `~/.gemini/antigravity/skills/` at startup, reads SKILL.md frontmatter, and activates skills when your request matches their description. Superpowers skills are made visible through a single symlink:

```text
~/.gemini/antigravity/skills/superpowers/ → ~/.gemini/antigravity/superpowers/skills/
```

The `GEMINI.md` bootstrap ensures the `using-superpowers` skill activates first, which enforces skill usage discipline across all tasks.

## Usage

Skills are discovered automatically. Antigravity activates them when:
- You mention a skill by name (e.g., "use brainstorming")
- The task matches a skill's description
- The `using-superpowers` skill directs Antigravity to use one

### Project-Level Skills

For project-specific skills, use the workspace `.agent/skills/` directory:

```bash
mkdir -p .agent/skills/my-skill
```

Create `.agent/skills/my-skill/SKILL.md`:

```markdown
---
name: my-skill
description: Use when [condition] - [what it does]
---

# My Skill

[Your skill content here]
```

### Personal Skills

Create your own global skills in `~/.gemini/antigravity/skills/`:

**Linux/macOS:**
```bash
mkdir -p ~/.gemini/antigravity/skills/my-skill
```

**Windows (PowerShell):**
```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.gemini\antigravity\skills\my-skill"
```

Create a `SKILL.md` file with the same format as above. The `description` field is how Antigravity decides when to activate a skill automatically — write it as a clear trigger condition.

## Skill Locations

Antigravity discovers skills from these locations:

1. **Project skills** (`.agent/skills/`) - Highest priority
2. **Personal skills** (`~/.gemini/antigravity/skills/`)
3. **Superpowers skills** (`~/.gemini/antigravity/skills/superpowers/`) - via symlink

## Updating

**Linux/macOS:**
```bash
cd ~/.gemini/antigravity/superpowers && git pull
```

**Windows (PowerShell):**
```powershell
cd "$env:USERPROFILE\.gemini\antigravity\superpowers"; git pull
```

Skills update instantly through the symlink.

## Uninstalling

**Linux/macOS:**
```bash
rm ~/.gemini/antigravity/skills/superpowers
```

**Windows (PowerShell):**
```powershell
Remove-Item "$env:USERPROFILE\.gemini\antigravity\skills\superpowers"
```

Optionally delete the clone: `rm -rf ~/.gemini/antigravity/superpowers` (Windows: `Remove-Item -Recurse -Force "$env:USERPROFILE\.gemini\antigravity\superpowers"`).

## Troubleshooting

### Skills not showing up

1. Verify the symlink: `ls -la ~/.gemini/antigravity/skills/superpowers`
2. Check skills exist: `ls ~/.gemini/antigravity/superpowers/skills`
3. Restart Antigravity — skills are discovered at startup

### Bootstrap not working

1. Verify `~/.gemini/GEMINI.md` exists and contains the superpowers section
2. Check that using-superpowers skill exists: `ls ~/.gemini/antigravity/superpowers/skills/using-superpowers/SKILL.md`
3. Restart Antigravity after changes

### Windows junction issues

Junctions normally work without special permissions. If creation fails, try running PowerShell as administrator.

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Main documentation: https://github.com/obra/superpowers
