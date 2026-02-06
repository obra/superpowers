# Installing Superpowers for Cursor

Quick setup to enable superpowers skills in Cursor.

> **Important:** Cursor does not discover symlinked rules, skills, agents, or commands. 
> This installation uses copy-based setup to ensure proper discovery. After updating 
> superpowers, you'll need to re-copy the files (see Updating section).

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

3. **Copy superpowers skills**:

   ```bash
   rm -rf ~/.cursor/skills/superpowers
   cp -r ~/.cursor/superpowers/skills ~/.cursor/skills/superpowers
   ```

4. **Copy superpowers rules**:

   ```bash
   mkdir -p ~/.cursor/rules
   cp ~/.cursor/superpowers/.cursor/rules/superpowers.mdc ~/.cursor/rules/superpowers.mdc
   ```

5. **Copy superpowers subagents**:

   ```bash
   mkdir -p ~/.cursor/agents
   rm -rf ~/.cursor/agents/superpowers
   cp -r ~/.cursor/superpowers/agents ~/.cursor/agents/superpowers
   ```

6. **Copy superpowers commands**:

   ```bash
   mkdir -p ~/.cursor/commands
   rm -rf ~/.cursor/commands/superpowers
   cp -r ~/.cursor/superpowers/commands ~/.cursor/commands/superpowers
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

3. **Copy superpowers skills**:

   ```bash
   rm -rf .cursor/skills/superpowers
   cp -r .cursor/superpowers/skills .cursor/skills/superpowers
   ```

4. **Copy superpowers rule**:

   ```bash
   mkdir -p .cursor/rules
   cp .cursor/superpowers/.cursor/rules/superpowers.mdc .cursor/rules/superpowers.mdc
   ```

5. **Copy superpowers subagents**:

   ```bash
   mkdir -p .cursor/agents
   cp -r .cursor/superpowers/agents/* .cursor/agents/
   ```

6. **Copy superpowers commands**:

   ```bash
   mkdir -p .cursor/commands
   cp -r .cursor/superpowers/commands/* .cursor/commands/
   ```

## Usage

### Automatic Discovery

Cursor automatically discovers:

- **Skills** from:
  - `.cursor/skills/` (project-level)
  - `~/.cursor/skills/` (global-level)
- **Subagents** from:
  - `.cursor/agents/` (project-level)
  - `~/.cursor/agents/` (global-level)
- **Commands** from:
  - `.cursor/commands/` (project-level)
  - `~/.cursor/commands/` (global-level)

### Manual Invocation

Skills can be manually invoked in chat using `/skill-name` syntax.

Subagents can be manually invoked using `/name` syntax or natural language requests:
- `/name` syntax: `/code-reviewer review this code`
- Natural language: `Use the code-reviewer subagent to review this code`

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

## Priority Order

### Skills

Skills are loaded in this priority order (highest to lowest):

1. Project personal skills (`.cursor/skills/`)
2. Project superpowers skills (`.cursor/skills/superpowers/`)
3. Global personal skills (`~/.cursor/skills/`)
4. Global superpowers skills (`~/.cursor/skills/superpowers/`)

### Subagents

Subagents are loaded from:

- Project: `.cursor/agents/` (highest priority)
- Global: `~/.cursor/agents/` (fallback)

### Commands

Commands are loaded from:

- Project: `.cursor/commands/` (highest priority)
- Global: `~/.cursor/commands/` (fallback)

## Updating

```bash
# Global installation
cd ~/.cursor/superpowers
git pull

# After git pull, sync the copies:
# Global installation
rm -rf ~/.cursor/skills/superpowers ~/.cursor/agents/superpowers ~/.cursor/commands/superpowers
cp -r ~/.cursor/superpowers/skills ~/.cursor/skills/superpowers
cp -r ~/.cursor/superpowers/agents ~/.cursor/agents/superpowers
cp -r ~/.cursor/superpowers/commands ~/.cursor/commands/superpowers
cp ~/.cursor/superpowers/.cursor/rules/superpowers.mdc ~/.cursor/rules/superpowers.mdc

# Project installation
cd .cursor/superpowers
git pull

# After git pull, sync the copies:
# Project installation
rm -rf .cursor/skills/superpowers
cp -r .cursor/superpowers/skills .cursor/skills/superpowers
cp .cursor/superpowers/.cursor/rules/superpowers.mdc .cursor/rules/superpowers.mdc
cp -r .cursor/superpowers/agents/* .cursor/agents/
cp -r .cursor/superpowers/commands/* .cursor/commands/
```
