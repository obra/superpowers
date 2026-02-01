# Installing Superpowers for Cursor

Quick setup to enable superpowers skills in Cursor.

## Installation

### Option 1: Global Installation (Recommended)

Install superpowers globally for use across all Cursor projects.

1. **Clone superpowers repository**:
   ```bash
   mkdir -p ~/.cursor/superpowers
   cd ~/.cursor/superpowers
   git clone https://github.com/obra/superpowers.git .
   ```

2. **Create skills directory**:
   ```bash
   mkdir -p ~/.cursor/skills
   ```

3. **Symlink superpowers skills**:
   ```bash
   rm -rf ~/.cursor/skills/superpowers
   ln -s ~/.cursor/superpowers/skills ~/.cursor/skills/superpowers
   ```

4. **Symlink superpowers rules**:
   ```bash
   mkdir -p ~/.cursor/rules
   ln -sf ~/.cursor/superpowers/.cursor/rules/superpowers.mdc ~/.cursor/rules/superpowers.mdc
   ```
### Option 2: Project-Specific Installation

Install superpowers in a specific project (overrides global installation).

1. **Clone superpowers repository**:
   ```bash
   git clone https://github.com/obra/superpowers.git .cursor/superpowers
   ```

2. **Create skills directory**:
   ```bash
   mkdir -p .cursor/skills
   ```

3. **Symlink superpowers skills**:
   ```bash
   rm -rf .cursor/skills/superpowers
   ln -s ../superpowers/skills .cursor/skills/superpowers
   ```

4. **Copy superpowers rule**:
   ```bash
   mkdir -p .cursor/rules
   cp .cursor/superpowers/.cursor/rules/superpowers.mdc .cursor/rules/superpowers.mdc
   ```

## Usage

### Automatic Discovery

Cursor automatically discovers skills from:
- `.cursor/skills/` (project-level)
- `~/.cursor/skills/` (global-level)

### Manual Invocation

Skills can be manually invoked in chat using `/skill-name` syntax.

### Personal Skills

Create your own skills in the appropriate skills directory:
- Global: `~/.cursor/skills/my-skill/SKILL.md`
- Project: `.cursor/skills/my-skill/SKILL.md`

Create `~/.cursor/skills/my-skill/SKILL.md`:
```markdown
---
name: my-skill
description: Use when [condition] - [what it does]
---

# My Skill

[Your skill content here]
```

## Skill Priority Order

Skills are loaded in this priority order (highest to lowest):
1. Project personal skills (`.cursor/skills/`)
2. Project superpowers skills (`.cursor/skills/superpowers/`)
3. Global personal skills (`~/.cursor/skills/`)
4. Global superpowers skills (`~/.cursor/skills/superpowers/`)

## Updating

```bash
# Global installation
cd ~/.cursor/superpowers
git pull

# Project installation
cd .cursor/superpowers
git pull
```
