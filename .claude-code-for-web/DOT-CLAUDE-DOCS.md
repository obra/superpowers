# The ~/.claude Directory

This document describes the layout and purpose of the `~/.claude` directory used by Claude Code.

## Overview

The `~/.claude` directory is Claude Code's user-level configuration and data directory. It stores settings, skills, project data, and session state.

## Directory Structure

```
~/.claude/
├── settings.json          # User-level settings and hooks
├── skills/                # Personal skills directory
│   └── <skill-name>/
│       └── SKILL.md
├── projects/              # Project-specific data (hashed by path)
│   └── <project-hash>/
├── session-env/           # Session environment data (by session UUID)
│   └── <session-uuid>/
├── todos/                 # TodoWrite task lists (by session/agent)
│   └── <uuid>-agent-<uuid>.json
├── shell-snapshots/       # Shell state snapshots
│   └── snapshot-bash-<timestamp>-<id>.sh
├── statsig/               # Analytics/feature flags
└── *.sh                   # User hook scripts
```

## Key Files and Directories

### settings.json

User-level Claude Code configuration. Supports:

- **hooks**: Define commands to run on events (SessionStart, Stop, etc.)
- **permissions**: Tool permissions (allow/deny lists)

Example:
```json
{
    "$schema": "https://json.schemastore.org/claude-code-settings.json",
    "hooks": {
        "Stop": [
            {
                "matcher": "",
                "hooks": [
                    {
                        "type": "command",
                        "command": "~/.claude/stop-hook-git-check.sh"
                    }
                ]
            }
        ]
    },
    "permissions": {
        "allow": ["Skill"]
    }
}
```

### skills/

Personal skills directory. Skills here are available across all projects and sessions.

Structure:
```
skills/
└── my-skill/
    └── SKILL.md    # Skill definition with frontmatter
```

Skill files use YAML frontmatter:
```markdown
---
name: my-skill
description: Use when [condition] - [what it does]
---

# My Skill

[Skill content here]
```

**Skill priority**: Project skills (`.claude/skills/`) override personal skills (`~/.claude/skills/`).

### projects/

Project-specific data, organized by hashed project paths. Contains project settings and state that persists across sessions for a given project directory.

### session-env/

Session environment data organized by session UUID. Stores environment variables and session-specific state.

### todos/

TodoWrite task lists stored as JSON files. Named by session/agent UUID. Used to track task progress during conversations.

### shell-snapshots/

Shell state snapshots for session recovery. Captures environment variables and shell state at various points.

## Superpowers Installation

When Superpowers is installed for Claude Code for Web, skills are written to:

```
~/.claude/skills/superpowers/
├── brainstorming/
│   └── SKILL.md
├── test-driven-development/
│   └── SKILL.md
└── ... (all other skills)
```

This keeps Superpowers skills namespaced separately from other personal skills.

## Related Directories

- **Project-level**: `.claude/` in project root for project-specific settings and skills
- **Plugins**: `~/.claude/plugins/` for installed plugins (CLI version only)

## Platform Notes

- Path is typically `~/.claude/` on Unix-like systems
- On Windows, location may vary based on home directory configuration
- Claude Code for Web has access to this directory for reading/writing skills
