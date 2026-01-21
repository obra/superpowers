# Superpowers for Antigravity IDE

Complete guide for using Superpowers with Antigravity IDE.

## Quick Install

Tell Antigravity:

```
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.antigravity/INSTALL.md
```

## Manual Installation

### Prerequisites

- Antigravity IDE installed
- Git installed

### Installation Steps

#### 1. Clone Superpowers

**Linux/macOS:**
```bash
git clone https://github.com/obra/superpowers.git ~/.gemini/antigravity/superpowers
```

**Windows (PowerShell):**
```powershell
git clone https://github.com/obra/superpowers.git "$env:USERPROFILE\.gemini\antigravity\superpowers"
```

#### 2. Copy Skills

Copy the skills folder to your workspace:

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

#### 3. Verify Installation

In Antigravity, ask: "What skills are available?"

You should see superpowers skills listed.

## Usage

Skills activate automatically based on context. For example:

- Say "I want to build a new feature" → `brainstorming` skill activates
- Say "I need to debug this issue" → `systematic-debugging` skill activates
- Say "Let's implement this" → `test-driven-development` skill activates

---

## Global Installation (Alternative)

If you prefer to install skills globally (available across all projects):

**Linux/macOS:**
```bash
cp -r ~/.gemini/antigravity/superpowers/skills ~/.gemini/antigravity/global_skills
```

**Windows:**
```powershell
Copy-Item -Recurse "$env:USERPROFILE\.gemini\antigravity\superpowers\skills" "$env:USERPROFILE\.gemini\antigravity\global_skills"
```

---

## Personal Skills

To add personal skills, create new skill folders in `.agent/skills/`:

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

## Updating

```bash
cd ~/.gemini/antigravity/superpowers
git pull
```

Then re-copy the skills folder to your project.

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Main documentation: https://github.com/obra/superpowers
