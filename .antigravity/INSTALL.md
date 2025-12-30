# Installing Superpowers for Antigravity IDE

## Prerequisites

- [Antigravity IDE](https://antigravity.dev) installed
- Node.js installed (v14+, v18+ recommended)
- Git installed

## Installation Steps

### 1. Clone Superpowers

**Linux/macOS:**
```bash
mkdir -p ~/.antigravity/superpowers
git clone https://github.com/obra/superpowers.git ~/.antigravity/superpowers
```

**Windows (PowerShell):**
```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.antigravity\superpowers"
git clone https://github.com/obra/superpowers.git "$env:USERPROFILE\.antigravity\superpowers"
```

### 2. Configure Global Rules

Add the following to your `~/.gemini/GEMINI.md` (or create the file if it doesn't exist):

**Linux/macOS:**
```bash
mkdir -p ~/.gemini
cat >> ~/.gemini/GEMINI.md << 'EOF'

## Superpowers System

<EXTREMELY_IMPORTANT>
You have superpowers. Superpowers teach you new skills and capabilities.
**RIGHT NOW** run: `~/.antigravity/superpowers/.antigravity/superpowers-antigravity bootstrap` and follow the instructions it returns!!!
</EXTREMELY_IMPORTANT>
EOF
```

**Windows (PowerShell):**
```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.gemini"
Add-Content -Path "$env:USERPROFILE\.gemini\GEMINI.md" -Value @"

## Superpowers System

<EXTREMELY_IMPORTANT>
You have superpowers. Superpowers teach you new skills and capabilities.
**RIGHT NOW** run: ``node `$env:USERPROFILE\.antigravity\superpowers\.antigravity\superpowers-antigravity bootstrap`` and follow the instructions it returns!!!
</EXTREMELY_IMPORTANT>
"@
```

### 3. Install Global Workflow Commands

Copy the workflow commands to enable `/brainstorm`, `/write-plan`, and `/execute-plan` slash commands:

**Linux/macOS:**
```bash
mkdir -p ~/.gemini/antigravity/global_workflows
cp ~/.antigravity/superpowers/.antigravity/commands/*.md ~/.gemini/antigravity/global_workflows/
```

**Windows (PowerShell):**
```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.gemini\antigravity\global_workflows"
Copy-Item "$env:USERPROFILE\.antigravity\superpowers\.antigravity\commands\*.md" "$env:USERPROFILE\.gemini\antigravity\global_workflows\"
```

### 4. Verify Installation

Tell Antigravity:

```
Run node ~/.antigravity/superpowers/.antigravity/superpowers-antigravity find-skills to show available skills
```

You should see a list of available skills with descriptions.

## Usage

### Finding Skills

```
Run ~/.antigravity/superpowers/.antigravity/superpowers-antigravity find-skills
```

### Loading a Skill

```
Run ~/.antigravity/superpowers/.antigravity/superpowers-antigravity use-skill superpowers:brainstorming
```

### Bootstrap All Skills

```
Run ~/.antigravity/superpowers/.antigravity/superpowers-antigravity bootstrap
```

This loads the complete bootstrap with all skill information.

### Personal Skills

Create your own skills in `~/.antigravity/skills/`:

```bash
mkdir -p ~/.antigravity/skills/my-skill
```

Create `~/.antigravity/skills/my-skill/SKILL.md`:

```markdown
---
name: my-skill
description: Use when [condition] - [what it does]
---

# My Skill

[Your skill content here]
```

Personal skills override superpowers skills with the same name.

## Updating

**Linux/macOS:**
```bash
cd ~/.antigravity/superpowers
git pull
```

**Windows (PowerShell):**
```powershell
cd "$env:USERPROFILE\.antigravity\superpowers"
git pull
```

## Troubleshooting

### Skills not found

1. Verify installation: `ls ~/.antigravity/superpowers/skills` (or `dir` on Windows)
2. Check CLI works: `node ~/.antigravity/superpowers/.antigravity/superpowers-antigravity find-skills`
3. Verify skills have SKILL.md files

### CLI script not working

Ensure Node.js is installed:
```bash
node --version
```

Should show v14 or higher (v18+ recommended for ES module support).

### Permission denied (Linux/macOS)

If you downloaded as a ZIP/archive instead of using git clone, make the script executable:
```bash
chmod +x ~/.antigravity/superpowers/.antigravity/superpowers-antigravity
```

### Windows path issues

On Windows, you may need to use the full path with `node`:
```powershell
node C:\Users\<username>\.antigravity\superpowers\.antigravity\superpowers-antigravity bootstrap
```

Or use the `$env:USERPROFILE` variable:
```powershell
node "$env:USERPROFILE\.antigravity\superpowers\.antigravity\superpowers-antigravity" bootstrap
```

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Main documentation: https://github.com/obra/superpowers
