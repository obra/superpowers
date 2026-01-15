# Installing Superpowers for Antigravity IDE

Antigravity IDE has native Skills support. Follow these steps to install superpowers skills.

## Installation

### 1. Clone the repository

**Linux/macOS:**
```bash
git clone https://github.com/obra/superpowers.git ~/.gemini/antigravity/superpowers
```

**Windows:**
```powershell
git clone https://github.com/obra/superpowers.git "$env:USERPROFILE\.gemini\antigravity\superpowers"
```

### 2. Copy skills to your project

Copy the skills folder to your workspace's `.agent/skills` directory:

**Linux/macOS:**
```bash
mkdir -p .agent
cp -r ~/.gemini/antigravity/superpowers/skills .agent/skills
```

**Windows:**
```powershell
New-Item -ItemType Directory -Force -Path ".agent"
Copy-Item -Recurse "$env:USERPROFILE\.gemini\antigravity\superpowers\skills" ".agent\skills"
```

### 3. Verify installation

**Linux/macOS:**
```bash
ls .agent/skills/
```

**Windows:**
```powershell
Get-ChildItem ".agent\skills"
```

You should see skill folders like `brainstorming`, `writing-plans`, `test-driven-development`, etc.

## Done!

Skills are now available in Antigravity IDE. They activate automatically based on context.

## Updating

To update skills, pull the latest changes and copy again:

```bash
cd ~/.gemini/antigravity/superpowers && git pull
```

Then re-copy the skills folder to your project.

---

## Global Installation (Alternative)

If you prefer to install skills globally (available across all projects):

**Linux/macOS:**
```bash
cp -r ~/.gemini/antigravity/superpowers/skills ~/.gemini/antigravity/skills
```

**Windows:**
```powershell
Copy-Item -Recurse "$env:USERPROFILE\.gemini\antigravity\superpowers\skills" "$env:USERPROFILE\.gemini\antigravity\skills"
```

---

## Personal Skills

To add personal skills alongside superpowers, create new skill folders in `.agent/skills/`:

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
