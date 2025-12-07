# Superpowers for Claude Code for Web

This directory contains installation and usage instructions for using Superpowers with Claude Code for Web (the browser-based version of Claude Code).

## Why a Separate Installation Method?

The standard installation instructions in the main README.md don't work for Claude Code for Web because they rely on features only available in the CLI version:

### CLI-Only Features Used by Standard Install

1. **Plugin Commands** - The `/plugin marketplace add` and `/plugin install` slash commands only exist in Claude Code CLI
2. **Shell Hooks** - The plugin uses a `SessionStart` hook that runs shell scripts (`session-start.sh`) to inject context at startup
3. **Local Filesystem** - The plugin expects to be installed locally at `~/.claude/plugins/`
4. **Shell Execution** - The `run-hook.cmd` polyglot wrapper requires bash/cmd.exe

### What Claude Code for Web Lacks

- No local filesystem access
- No shell/bash execution environment
- No plugin system with `/plugin` commands
- No hook execution capability
- No `${CLAUDE_PLUGIN_ROOT}` directory structure

## How This Version Works

Instead of local installation with hooks, Claude Code for Web uses **URL-based fetching**:

1. User tells Claude to fetch bootstrap instructions from GitHub
2. Claude learns about the skills system via the fetched content
3. Skills are fetched on-demand via WebFetch when needed
4. Each skill is loaded fresh from GitHub (always up-to-date)

## Limitations

### Fully Working

- All skill content is accessible via WebFetch
- Skills list is available and browsable
- Core workflows (brainstorming, TDD, debugging) work as documented
- Tool mapping guidance helps adapt skills to available tools

### Partially Working

| Feature | CLI Version | Web Version |
|---------|-------------|-------------|
| Auto-bootstrap at session start | Automatic via hook | Manual (user must request) |
| Skill discovery | `Skill` tool lists all | Must fetch skills-list.md |
| Personal/custom skills | `~/.claude/skills/` | Not supported |
| Project skills | `.claude/skills/` | Not supported (no filesystem) |

### Not Available

| Feature | Reason |
|---------|--------|
| **Subagent dispatch** | `Task` tool not available in web |
| **Git worktrees** | No shell access for git commands |
| **File editing** | Limited or no filesystem access |
| **Running tests** | No shell access for test runners |
| **Automatic session hooks** | No hook execution environment |
| **Plugin updates** | No plugin system; uses live GitHub URLs |

### Skill-Specific Limitations

Some skills are less useful or non-functional in Claude Code for Web:

- **using-git-worktrees** - Requires git CLI access
- **dispatching-parallel-agents** - Requires Task tool with subagents
- **subagent-driven-development** - Requires Task tool
- **executing-plans** - Requires shell access for verification steps
- **finishing-a-development-branch** - Requires git operations

These skills can still be fetched and read for educational purposes, but their workflows cannot be fully executed.

## Files in This Directory

| File | Purpose |
|------|---------|
| `INSTALL.md` | Step-by-step installation instructions |
| `README.md` | This file - overview and limitations |
| `bootstrap.md` | Bootstrap content Claude fetches at session start |
| `skills-list.md` | List of all available skills with URLs |

## Keeping Skills Updated

The skills-list.md file contains a static list of skills. When new skills are added to the `skills/` directory, this file should be updated to include them.

To add a new skill to the list:

1. Add an entry to the appropriate category table in `skills-list.md`
2. Include the skill name, description, and relative URL path
3. The full URL pattern is: `https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/skills/<skill-name>/SKILL.md`

## Recommended Workflow for Web Users

1. **Start of conversation**: Tell Claude to fetch the bootstrap
2. **Before any task**: Ask Claude to check the skills list
3. **When a skill applies**: Have Claude fetch and follow it
4. **For complex work**: Consider using Claude Code CLI instead for full functionality

## Getting Help

- **Issues**: https://github.com/obra/superpowers/issues
- **Main Documentation**: https://github.com/obra/superpowers
- **CLI Installation**: See main README.md for full-featured CLI installation
