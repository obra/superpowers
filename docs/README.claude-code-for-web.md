# Superpowers for Claude Code for Web

Complete guide for using Superpowers with Claude Code for Web (the browser-based version of Claude Code).

## Quick Install

Tell Claude Code for Web:

```
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.claude-code-for-web/INSTALL.md
```

## Manual Installation

### Prerequisites

- Claude Code for Web access
- A project with filesystem access

### Installation Steps

#### 1. Clone Superpowers

```bash
mkdir -p .claude/skills/superpowers
cd .claude/skills/superpowers
git clone https://github.com/obra/superpowers.git .
```

#### 2. Register the SessionStart Hook

Add to `.claude/settings.json` (create if it doesn't exist):

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Read and follow instructions from .claude/skills/superpowers/skills/using-superpowers/SKILL.md"
          }
        ]
      }
    ]
  }
}
```

If `.claude/settings.json` already exists, merge the hooks configuration.

#### 3. Verify Installation

Tell Claude:

```
Please list all your superpowers
```

You should see a list of skills (brainstorming, test-driven-development, systematic-debugging, etc.) and Claude should display the using-superpowers skill content.

## Usage

### Finding Skills

Ask Claude:

```
List all your superpowers
```

### Loading a Skill

#### The Easy Way
Ask Claude:
```
Load the brainstorming superpower skill
```

#### The Hard Way
Ask Claude:
```
Read and follow .claude/skills/superpowers/skills/brainstorming/SKILL.md
```

### Personal Skills

Create your own skills in `.claude/skills/`:

```bash
mkdir -p .claude/skills/my-skill
```

Create `.claude/skills/my-skill/SKILL.md`:

```markdown
---
name: my-skill
description: Use when [condition] - [what it does]
---

# My Skill

[Your skill content here]
```

Personal skills override superpowers skills with the same name.

## Why a Separate Installation Method?

The standard CLI installation doesn't work for Claude Code for Web because it relies on features only available in the CLI version:

### CLI-Only Features

| Feature | CLI Version | Web Version |
|---------|-------------|-------------|
| Plugin Commands | `/plugin marketplace add` | Not available |
| Shell Hooks | `SessionStart` runs shell scripts | Prompt-based hooks only |
| Plugin Directory | `.claude/plugins/` with hook execution | Not available |
| Shell Execution | Bash/cmd.exe wrappers | Limited shell access |

### How the Web Version Works

1. Skills are cloned to `.claude/skills/superpowers/`
2. A prompt-based `SessionStart` hook loads the bootstrap skill
3. Claude reads skills directly from the filesystem
4. Skills persist across sessions and update via `git pull`

## Claude Code CLI vs. Web Feature Comparison

### Fully Working

- All skill content is installed locally
- Skills persist across sessions
- Core workflows (brainstorming, TDD, debugging) work as documented
- Tool mapping guidance helps adapt skills to available tools

### Partially Working

| Feature | CLI Version | Web Version |
|---------|-------------|-------------|
| Auto-bootstrap at session start | Automatic via shell hook | Automatic via prompt hook |
| Skill discovery | `Skill` tool lists all | Read directory listing |
| Personal/custom skills | `.claude/skills/` | Supported (same location) |
| Project skills | `.claude/skills/` | Works if project filesystem accessible |

### Not Available

| Feature | Reason |
|---------|--------|
| Subagent dispatch | `Task` tool not available in web |
| Git worktrees | Limited shell access for git commands |
| Running tests | Limited shell access for test runners |
| Shell-based hooks | No shell hook execution environment |

### Skill-Specific Limitations

Some skills are less useful or non-functional in Claude Code for Web:

- **using-git-worktrees** - Requires git CLI access
- **dispatching-parallel-agents** - Requires Task tool with subagents
- **subagent-driven-development** - Requires Task tool
- **executing-plans** - Requires shell access for verification steps
- **finishing-a-development-branch** - Requires git operations

These skills can still be read for educational purposes, but their workflows cannot be fully executed.

NOTE: The above statement has not been fully tested or verified. There may be workarounds. Pull requests welcome.

## Tool Mapping

Skills written for Claude Code CLI are adapted for Claude Code for Web:

- `TodoWrite` → Same (available in web)
- `Task` with subagents → Not available; do work directly
- `Skill` tool → Read skill files directly
- File operations → Native web tools

## Updating

```bash
cd .claude/skills/superpowers
git pull
```

## Troubleshooting

### Skills not found

1. Verify installation: `ls .claude/skills/superpowers/skills`
2. Check skill structure: each skill needs a `SKILL.md` file
3. Verify the SessionStart hook is configured in `.claude/settings.json`

### SessionStart hook not triggering

1. Check `.claude/settings.json` exists and has valid JSON
2. Verify the hooks configuration is correctly structured
3. Start a new session to trigger the hook

### Bootstrap not loading

1. Verify the using-superpowers skill exists: `ls .claude/skills/superpowers/skills/using-superpowers/`
2. Try manually asking Claude to read the skill file
3. Check for any error messages in the session

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Main documentation: https://github.com/obra/superpowers
- For full functionality, consider using Claude Code CLI instead

## Note

Claude Code for Web support works differently from the CLI version due to platform limitations. If you need full functionality (subagents, git worktrees, shell access), use the Claude Code CLI.

---

# The ~/.claude Directory

This document describes the layout and purpose of the `~/.claude` directory used by Claude Code for web.

## Overview

The `~/.claude` directory is Claude Code for Web's user-level configuration and data directory. It stores settings, skills, project data, and session state. It is bootstrapped from some underlying image; changes made to it are not persisted.

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

**Skill priority**: Project skills (`.claude/skills/`) override personal skills (`~/.claude/skills/`).

### projects/

Project-specific data, organized by hashed project paths. Contains project settings and state that persists across sessions for a given project directory.

### session-env/

Session environment data organized by session UUID. Stores environment variables and session-specific state.

### todos/

TodoWrite task lists stored as JSON files. Named by session/agent UUID. Used to track task progress during conversations.

### shell-snapshots/

Shell state snapshots for session recovery. Captures environment variables and shell state at various points.

## Related Directories

- **Project-level**: `.claude/` in project root for project-specific settings and skills
- **Plugins**: `~/.claude/plugins/` for installed plugins (CLI version only)

## Platform Notes

- Path is typically `~/.claude/` on Unix-like systems
- Claude Code for Web has access to this directory for reading/writing skills
- This directory is bootstrapped from some source image; changes made are not persisted across sessions
