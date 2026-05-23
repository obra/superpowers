# Superpowers for Antigravity

Complete guide for using Superpowers with the Antigravity platform — **Antigravity CLI**, **Antigravity 2.0**, and **Antigravity IDE**. Although each product has its own application directory under `~/.gemini/` (e.g., `antigravity-cli`, `antigravity`, `antigravity-ide`), they all share the same global `~/.gemini/config/` directory, so skills only need to be installed once.

## Quick Install

Tell Antigravity:

```
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.antigravity/INSTALL.md
```

## Manual Installation

### Prerequisites

- Antigravity installed
- Git installed

### Installation Steps

#### 1. Clone Superpowers

**Linux/macOS:**
```bash
git clone https://github.com/obra/superpowers.git ~/.gemini/config/superpowers
```

**Windows (PowerShell):**
```powershell
git clone https://github.com/obra/superpowers.git "$env:USERPROFILE\.gemini\config\superpowers"
```

#### 2. Copy Skills (Global — Recommended)

Copy the skills folder to the shared global directory. This makes skills available across all Antigravity products and all projects.

**Linux/macOS:**
```bash
cp -r ~/.gemini/config/superpowers/skills ~/.gemini/config/skills
```

**Windows:**
```powershell
Copy-Item -Recurse "$env:USERPROFILE\.gemini\config\superpowers\skills" "$env:USERPROFILE\.gemini\config\skills"
```

#### 3. Configure Global Rules

Add the following content to your `~/.gemini/GEMINI.md` (Linux/macOS) or `$env:USERPROFILE\.gemini\GEMINI.md` (Windows) file:

```markdown
## Superpowers System

<EXTREMELY_IMPORTANT>
You have superpowers. Superpowers teach you new skills and capabilities.
**RIGHT NOW** use: **using-superpowers** skill and follow the instructions it returns!!!
</EXTREMELY_IMPORTANT>
```

#### 4. Verify Installation

In Antigravity, ask: "What skills are available?"

You should see superpowers skills listed.

## Usage

Skills activate automatically based on context. For example:

- Say "I want to build a new feature" → `brainstorming` skill activates
- Say "I need to debug this issue" → `systematic-debugging` skill activates
- Say "Let's implement this" → `test-driven-development` skill activates

---

## Project-Level Installation (Alternative)

If you prefer to install skills only for a specific project:

**Linux/macOS:**
```bash
mkdir -p .agent
cp -r ~/.gemini/config/superpowers/skills .agent/skills
```

**Windows:**
```powershell
New-Item -ItemType Directory -Force -Path ".agent"
Copy-Item -Recurse "$env:USERPROFILE\.gemini\config\superpowers\skills" ".agent\skills"
```

---

## Personal Skills

To add personal skills alongside superpowers, create new skill folders in `~/.gemini/config/skills/` (global) or `.agent/skills/` (project-level):

```bash
mkdir -p ~/.gemini/config/skills/my-skill
```

Create `~/.gemini/config/skills/my-skill/SKILL.md`:

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
cd ~/.gemini/config/superpowers
git pull
```

Then re-copy the skills folder to your global config or project.

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Main documentation: https://github.com/obra/superpowers
