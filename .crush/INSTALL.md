# Installing Superpowers for Crush

## Prerequisites

- [Crush](https://github.com/charmbracelet/crush) installed
- Git installed

## Installation Steps

### 1. Clone Superpowers

```bash
git clone https://github.com/obra/superpowers.git ~/.config/crush/superpowers
```

### 2. Create the Skills Symlink

```bash
mkdir -p ~/.config/crush/skills
rm -rf ~/.config/crush/skills/superpowers
ln -s ~/.config/crush/superpowers/skills ~/.config/crush/skills/superpowers
```

**Windows (PowerShell — Developer Mode or Admin required):**

```powershell
New-Item -ItemType Directory -Force -Path "$env:LOCALAPPDATA\crush\skills"
Remove-Item "$env:LOCALAPPDATA\crush\skills\superpowers" -Force -ErrorAction SilentlyContinue
New-Item -ItemType Junction -Path "$env:LOCALAPPDATA\crush\skills\superpowers" `
  -Target "$env:LOCALAPPDATA\crush\superpowers\skills"
```

### 3. Restart Crush

Restart Crush. Ask "do you have superpowers?" to verify.

## Verify Installation

```bash
ls -la ~/.config/crush/skills/superpowers
```

## How Skills Work

Crush natively discovers skills from `~/.config/crush/skills/` at startup and injects
them into the system prompt. Superpowers skills (including `using-superpowers`) are
automatically listed in the `<available_skills>` section of every session.

Crush reads each skill's `SKILL.md` when the task description matches. No special
commands needed — just work normally and Crush activates the right skill.

## Usage

### Finding Skills

Skills appear in `<available_skills>` in Crush's context at the start of each session.

### Loading a Skill

Ask Crush to use a skill by name, for example:

```
use the brainstorming skill
```

Or just describe what you want to do — Crush will match the task to the right skill
automatically based on the skill descriptions.

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

> **Note:** The `name` field must match the directory name exactly.

### Project Skills

Add a `skills_paths` entry to your project's `crush.json`:

```json
{
  "options": {
    "skills_paths": [".crush-skills"]
  }
}
```

Then create `.crush-skills/my-project-skill/SKILL.md` in your project.

**Skill Priority:** Project skills > Personal skills > Superpowers skills

## Updating

```bash
cd ~/.config/crush/superpowers
git pull
```

Skills update instantly through the symlink.

## Uninstalling

```bash
rm ~/.config/crush/skills/superpowers
rm -rf ~/.config/crush/superpowers
```

## Troubleshooting

### Skills not found

1. Check symlink: `ls -la ~/.config/crush/skills/superpowers`
2. Verify target: `ls ~/.config/crush/superpowers/skills/`
3. Restart Crush — skills are discovered at startup
4. Override with env var: `CRUSH_SKILLS_DIR=~/.config/crush/skills crush`

### Skills in a custom directory

Set `CRUSH_SKILLS_DIR` to override the default discovery path:

```bash
export CRUSH_SKILLS_DIR=~/.config/crush/skills
```

Or use `options.skills_paths` in `crush.json` to add extra paths without overriding the default.

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Full documentation: https://github.com/obra/superpowers/blob/main/docs/README.crush.md
