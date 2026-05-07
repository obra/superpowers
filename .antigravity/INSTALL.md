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

### 2. Choose installation scope

Before copying skills, ask the user which installation scope they want:

- **Global installation**: available across all Antigravity projects.
- **Current project installation**: available only in the current workspace.

### 3. Copy skills

#### Option A: Global installation

Copy the skills folder to Antigravity's global skills directory:

**Linux/macOS:**
```bash
mkdir -p ~/.gemini/antigravity
cp -r ~/.gemini/antigravity/superpowers/skills ~/.gemini/antigravity/skills
```

**Windows:**
```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.gemini\antigravity"
Copy-Item -Recurse "$env:USERPROFILE\.gemini\antigravity\superpowers\skills" "$env:USERPROFILE\.gemini\antigravity\skills"
```

#### Option B: Current project installation

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
ls ~/.gemini/antigravity/skills/
```

**Windows:**
```powershell
Get-ChildItem "$env:USERPROFILE\.gemini\antigravity\skills"
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

Skills are now available in Antigravity IDE. They activate automatically based on context.

## Updating

To update skills, pull the latest changes and copy again to the same scope you chose during installation:

```bash
cd ~/.gemini/antigravity/superpowers && git pull
```

Then re-copy the skills folder globally or to your current project.

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
