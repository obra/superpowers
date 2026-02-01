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

##### 3. Symlink Superpowers Skills

```bash
##### 4. Symlink Superpowers Skills

```bash
ln -s ~/.cursor/superpowers/skills ~/.cursor/skills/superpowers
```

##### 5. Symlink Superpowers Rules

```bash
mkdir -p ~/.cursor/rules
ln -sf ~/.cursor/superpowers/.cursor/rules/superpowers.mdc ~/.cursor/rules/superpowers.mdc
```
- Skills with checklists require update_plan todos for each item
- NEVER skip mandatory workflows (brainstorming before coding, TDD, systematic debugging)
- Use Cursor's native subagent system (@mention) when skills reference subagents

Available superpowers skills include brainstorming, systematic debugging, test-driven development, code review, and more.
</EXTREMELY_IMPORTANT>
```
</EXTREMELY_IMPORTANT>
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

```bash
ln -s ../superpowers/skills .cursor/skills/superpowers
```

##### 4. Copy Superpowers Rule

```bash
mkdir -p .cursor/rules
cp .cursor/superpowers/.cursor/rules/superpowers.mdc .cursor/rules/superpowers.mdc
```
```
- Skills with checklists require update_plan todos for each item
- NEVER skip mandatory workflows (brainstorming before coding, TDD, systematic debugging)
- Use Cursor's native subagent system (@mention) when skills reference subagents

Available superpowers skills include brainstorming, systematic debugging, test-driven development, code review, and more.
</EXTREMELY_IMPORTANT>
```

## Usage

### Automatic Discovery

Cursor automatically discovers skills from:
- `.cursor/skills/` (project-level)
- `~/.cursor/skills/` (global-level)

### Manual Invocation

Skills can be manually invoked in chat using `/skill-name` syntax.

### Bootstrap All Skills

The bootstrap information is available in `.cursor/superpowers-bootstrap.md` and provides context about the skill system.

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
│   ├── lib/             # Shared modules
│   └── .cursor/         # Cursor-specific files
└── skills/              # Personal skills + symlinked superpowers

Project Installation (.cursor/):
├── superpowers/         # Cloned repository
│   ├── skills/          # Superpowers skills
│   ├── lib/             # Shared modules
│   └── .cursor/         # Cursor-specific files
└── skills/              # Personal skills + symlinked superpowers
```

### Skill Priority

Skills are loaded in this priority order (highest to lowest):
1. Project personal skills (`.cursor/skills/`)
2. Project superpowers skills (`.cursor/skills/superpowers/`)
3. Global personal skills (`~/.cursor/skills/`)
4. Global superpowers skills (`~/.cursor/skills/superpowers/`)

### Tool Mapping

Skills written for Claude Code are adapted for Cursor with these mappings:

- `TodoWrite` → `update_plan` (your planning/task tracking tool)
- `Task` with subagents → Use Cursor's subagent system (@mention) or sequential fallback
- `Subagent` / `Agent` tool mentions → Map to Cursor's subagent system (@mention)
- File operations → Your native tools

## Updating

```bash
# Global installation
cd ~/.cursor/superpowers
git pull
### Rules not working

1. Ensure `.cursor/rules/superpowers.mdc` exists in the project root
2. Verify the frontmatter has `alwaysApply: true`
3. Restart Cursor after creating the rule file

## Troubleshooting

### Skills not found

1. Verify installation: `ls ~/.cursor/skills/superpowers` (global) or `ls .cursor/skills/superpowers` (project)
2. Verify skills have SKILL.md files
3. Check that symlinks are working: `ls -la ~/.cursor/skills/superpowers` (global) or `ls -la .cursor/skills/superpowers` (project)

### Rules not working

1. Ensure `.cursor/rules/superpowers.mdc` exists in the project root
2. Verify the frontmatter has `alwaysApply: true`
3. Restart Cursor after creating the rule file

### Skills not overriding properly

Check the skill priority order. Project skills override global skills with the same name.

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Main documentation: https://github.com/obra/superpowers
- Blog post: https://blog.fsck.com/2025/10/27/skills-for-openai-codex/

## Note

Cursor support leverages Cursor's native skill discovery system for seamless integration. If you encounter issues, please report them on GitHub.
