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

### 3. Inject the Bootstrap

Append the superpowers context to your global Crush AGENTS.md:

```bash
mkdir -p ~/.config/crush
cat ~/.config/crush/superpowers/.crush/AGENTS.md >> ~/.config/crush/AGENTS.md
```

**Windows (PowerShell):**

```powershell
$crush = "$env:LOCALAPPDATA\crush"
New-Item -ItemType Directory -Force -Path $crush
Get-Content "$crush\superpowers\.crush\AGENTS.md" | Add-Content "$crush\AGENTS.md"
```

### 4. Restart Crush

Restart Crush. Ask "do you have superpowers?" to verify.

## Verify Installation

```bash
ls -la ~/.config/crush/skills/superpowers
cat ~/.config/crush/AGENTS.md | grep -i superpowers
```

## Usage

### Finding Skills

Use Crush's native skill tool to list all available skills.

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

Remove the superpowers block from `~/.config/crush/AGENTS.md` manually.

## Troubleshooting

### Skills not found

1. Check symlink: `ls -la ~/.config/crush/skills/superpowers`
2. Verify target: `ls ~/.config/crush/superpowers/skills/`
3. Restart Crush — skills are discovered at startup

### Bootstrap not active

1. Check AGENTS.md: `cat ~/.config/crush/AGENTS.md | grep superpowers`
2. Re-run the bootstrap append command (Step 3)

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Full documentation: https://github.com/obra/superpowers/blob/main/docs/README.crush.md
