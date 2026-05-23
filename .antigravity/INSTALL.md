# Installing Superpowers for Antigravity

The Antigravity platform — including **Antigravity CLI**, **Antigravity 2.0**, and **Antigravity IDE** — has native Skills support. Although each product has its own application directory under `~/.gemini/` (e.g., `antigravity-cli`, `antigravity`, `antigravity-ide`), they all share the same global configuration under `~/.gemini/config/`, so skills installed once are available everywhere.

## Installation

### 1. Clone the repository

**Linux/macOS:**
```bash
git clone https://github.com/obra/superpowers.git ~/.gemini/config/superpowers
```

**Windows:**
```powershell
git clone https://github.com/obra/superpowers.git "$env:USERPROFILE\.gemini\config\superpowers"
```

### 2. Choose installation scope

Before copying skills, ask the user which installation scope they want:

- **Global installation** (recommended): available across all Antigravity products and all projects.
- **Current project installation**: available only in the current workspace.

### 3. Copy skills

#### Option A: Global installation (recommended)

Copy the skills folder to Antigravity's global skills directory. Skills installed here are shared across Antigravity CLI, Antigravity 2.0, and Antigravity IDE.

**Linux/macOS:**
```bash
mkdir -p ~/.gemini/config
cp -r ~/.gemini/config/superpowers/skills ~/.gemini/config/skills
```

**Windows:**
```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.gemini\config"
Copy-Item -Recurse "$env:USERPROFILE\.gemini\config\superpowers\skills" "$env:USERPROFILE\.gemini\config\skills"
```

#### Option B: Current project installation

Copy the skills folder to your workspace's `.agent/skills` directory:

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

### 4. Configure Global Rules

Add the following content to your `~/.gemini/GEMINI.md` (Linux/macOS) or `$env:USERPROFILE\.gemini\GEMINI.md` (Windows) file:

```markdown
## Superpowers System

<EXTREMELY_IMPORTANT>
You have superpowers. Superpowers teach you new skills and capabilities.
**RIGHT NOW** use: **using-superpowers** skill and follow the instructions it returns!!!
</EXTREMELY_IMPORTANT>
```

### 5. Verify installation

For global installation:

**Linux/macOS:**
```bash
ls ~/.gemini/config/skills/
```

**Windows:**
```powershell
Get-ChildItem "$env:USERPROFILE\.gemini\config\skills"
```

For current project installation:

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

Skills are now available across all Antigravity products. They activate automatically based on context.

## Updating

To update skills, pull the latest changes and copy again to the same scope you chose during installation:

```bash
cd ~/.gemini/config/superpowers && git pull
```

Then re-copy the skills folder globally or to your current project.

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
