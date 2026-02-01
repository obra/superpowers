# Superpowers for Cursor

Complete guide for using Superpowers with Cursor IDE.

## Quick Install

Tell Cursor:

```
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.cursor/INSTALL.md
```

## Manual Installation

### Prerequisites

- [Cursor IDE](https://cursor.com) installed
- Git installed

> **Important:** Cursor does not discover symlinked rules, skills, agents, or commands. 
> This installation uses copy-based setup to ensure proper discovery. After updating 
> superpowers, you'll need to re-copy the files (see Updating section).

### Installation Steps

#### Option 1: Global Installation (Recommended)

Install superpowers globally for use across all Cursor projects.

##### 1. Clone Superpowers

```bash
mkdir -p ~/.cursor/superpowers
cd ~/.cursor/superpowers
git clone https://github.com/obra/superpowers.git .
```

##### 2. Create Skills Directory

```bash
mkdir -p ~/.cursor/skills
```

##### 3. Copy Superpowers Skills

```bash
rm -rf ~/.cursor/skills/superpowers
cp -r ~/.cursor/superpowers/skills ~/.cursor/skills/superpowers
```

##### 4. Copy Superpowers Subagents

```bash
mkdir -p ~/.cursor/agents
rm -rf ~/.cursor/agents/superpowers
cp -r ~/.cursor/superpowers/agents ~/.cursor/agents/superpowers
```

##### 5. Copy Superpowers Commands

```bash
mkdir -p ~/.cursor/commands
rm -rf ~/.cursor/commands/superpowers
cp -r ~/.cursor/superpowers/commands ~/.cursor/commands/superpowers
```

##### 6. Copy Superpowers Rules

```bash
mkdir -p ~/.cursor/rules
cp ~/.cursor/superpowers/.cursor/rules/superpowers.mdc ~/.cursor/rules/superpowers.mdc
```

#### Option 2: Project-Specific Installation

Install superpowers in a specific project (overrides global installation).

##### 1. Clone Superpowers

```bash
git clone https://github.com/obra/superpowers.git .cursor/superpowers
```

##### 2. Create Skills Directory

```bash
mkdir -p .cursor/skills
```

##### 3. Copy Superpowers Skills

```bash
rm -rf .cursor/skills/superpowers
cp -r .cursor/superpowers/skills .cursor/skills/superpowers
```

##### 4. Copy Superpowers Subagents

```bash
mkdir -p .cursor/agents
cp -r .cursor/superpowers/agents/* .cursor/agents/
```

##### 5. Copy Superpowers Commands

```bash
mkdir -p .cursor/commands
cp -r .cursor/superpowers/commands/* .cursor/commands/
```

##### 6. Copy Superpowers Rule

```bash
mkdir -p .cursor/rules
cp .cursor/superpowers/.cursor/rules/superpowers.mdc .cursor/rules/superpowers.mdc
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

### Built-in Subagents

Cursor includes three built-in subagents that handle context-heavy operations automatically:

- **Explore**: Searches and analyzes codebases (uses faster model for parallel searches)
- **Bash**: Runs series of shell commands (isolates verbose output)
- **Browser**: Controls browser via MCP tools (filters DOM snapshots and screenshots)

These subagents are used automatically when appropriate and don't need configuration.

### Subagent File Format

Custom subagents are markdown files with YAML frontmatter:

```markdown
---
name: code-reviewer
description: Use when a major project step has been completed and needs to be reviewed
model: inherit
---

[Your subagent prompt here]
```

**Configuration fields:**
- `name` (required): Unique identifier
- `description` (required): When to use this subagent
- `model` (optional): `fast`, `inherit`, or specific model ID
- `readonly` (optional): If `true`, runs with restricted write permissions
- `is_background` (optional): If `true`, runs in background without waiting

### Manual Invocation

Skills can be manually invoked in chat using `/skill-name` syntax.

Subagents can be manually invoked using `/name` syntax or natural language requests:

- `/name` syntax: `/code-reviewer review this code`
- Natural language: `Use the code-reviewer subagent to review this code`

Commands can be manually invoked in chat using `/command-name` syntax.

### Bootstrap Information

The bootstrap information is available in `.cursor/superpowers-bootstrap.md` and provides context about the skills, subagents, and commands systems.

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

Personal skills override superpowers skills with the same name.

## Architecture

### Shared Core Module

**Location:** `~/.cursor/superpowers/lib/skills-core.js`

The Cursor implementation uses the shared `skills-core` module for skill discovery and parsing. This is the same module used by the Codex and OpenCode implementations, ensuring consistent behavior across platforms.

### Directory Structure

Cursor supports both global and project-specific skill directories:

```
Global Installation (~/.cursor/):
├── superpowers/          # Cloned repository
│   ├── skills/          # Superpowers skills
│   ├── agents/          # Superpowers subagents
│   ├── commands/        # Superpowers commands
│   ├── lib/             # Shared modules
│   └── .cursor/         # Cursor-specific files
├── skills/              # Personal skills + copied superpowers
├── agents/              # Personal subagents + copied superpowers
├── commands/            # Personal commands + copied superpowers
└── rules/
    └── superpowers.mdc  # Copied from superpowers

Project Installation (.cursor/):
├── superpowers/         # Cloned repository
│   ├── skills/          # Superpowers skills
│   ├── agents/          # Superpowers subagents
│   ├── commands/        # Superpowers commands
│   ├── lib/             # Shared modules
│   └── .cursor/         # Cursor-specific files
├── skills/              # Personal skills + copied superpowers
├── agents/              # Personal subagents + copied superpowers
├── commands/            # Personal commands + copied superpowers
└── rules/
    └── superpowers.mdc  # Copied from superpowers
```

### Skill Priority

Skills are loaded in this priority order (highest to lowest):
1. Project personal skills (`.cursor/skills/`)
2. Project superpowers skills (`.cursor/skills/superpowers/`)
3. Global personal skills (`~/.cursor/skills/`)
4. Global superpowers skills (`~/.cursor/skills/superpowers/`)

### Subagents Priority

Subagents are loaded from:

- Project: `.cursor/agents/` (highest priority)
- Global: `~/.cursor/agents/` (fallback)

### Commands Priority

Commands are loaded from:

- Project: `.cursor/commands/` (highest priority)
- Global: `~/.cursor/commands/` (fallback)

### Parallel Execution

You can launch multiple subagents concurrently for maximum throughput:

```text
Review the API changes and update the documentation in parallel
```

This allows Cursor to work on different parts of your codebase simultaneously, significantly reducing overall execution time.

### Tool Mapping

Skills written for Claude Code are adapted for Cursor with these mappings:

- `TodoWrite` → `update_plan` (your planning/task tracking tool)
- `Task` with subagents → Use Cursor's subagent system (/name syntax) or sequential fallback
- `Subagent` / `Agent` tool mentions → Map to Cursor's subagent system (/name syntax)
- File operations → Your native tools

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

## Troubleshooting

### Skills not found

1. Verify installation: `ls ~/.cursor/skills/superpowers` (global) or `ls .cursor/skills/superpowers` (project)
2. Verify skills have SKILL.md files
3. Check that directories contain the copied files: `ls ~/.cursor/skills/superpowers/` (global) or `ls .cursor/skills/superpowers/` (project)

### Rules not working

1. Ensure `.cursor/rules/superpowers.mdc` exists in the project root
2. Verify the frontmatter has `alwaysApply: true`
3. Restart Cursor after creating the rule file

### Subagents not found

1. Verify installation: `ls ~/.cursor/agents/superpowers` (global) or `ls .cursor/agents/` (project)
2. Verify subagents have .md files with proper YAML frontmatter
3. Check that directories contain the copied files: `ls ~/.cursor/agents/superpowers/` (global) or `ls .cursor/agents/` (project)
4. For invocation issues, try `/subagent-name` syntax or natural language requests instead of `@` syntax (which is for files/folders/code/docs, not subagents)

### Commands not found

1. Verify installation: `ls ~/.cursor/commands/superpowers` (global) or `ls .cursor/commands/` (project)
2. Verify commands have .md files
3. Check that directories contain the copied files: `ls ~/.cursor/commands/superpowers/` (global) or `ls .cursor/commands/` (project)

### Skills not overriding properly

Check the skill priority order. Project skills override global skills with the same name.

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Main documentation: https://github.com/obra/superpowers
- Blog post: https://blog.fsck.com/2025/10/27/skills-for-openai-codex/

## Note

Cursor support leverages Cursor's native skill discovery system for seamless integration. If you encounter issues, please report them on GitHub.
