# Superpowers for Claude Code for Web

This directory contains installation and usage instructions for using Superpowers with Claude Code for Web (the browser-based version of Claude Code).

## Why a Separate Installation Method?

The standard installation instructions in the main README.md don't work for Claude Code for Web because they rely on features only available in the CLI version:

### CLI-Only Features Used by Standard Install

1. **Plugin Commands** - The `/plugin marketplace add` and `/plugin install` slash commands only exist in Claude Code CLI
2. **Shell Hooks** - The plugin uses a `SessionStart` hook that runs shell scripts (`session-start.sh`) to inject context at startup
3. **Plugin Directory** - The plugin expects to be installed at `~/.claude/plugins/` with hook execution
4. **Shell Execution** - The `run-hook.cmd` polyglot wrapper requires bash/cmd.exe

### What Claude Code for Web Lacks

- No shell/bash execution environment
- No plugin system with `/plugin` commands
- No hook execution capability
- No `${CLAUDE_PLUGIN_ROOT}` directory structure

## How This Version Works

Claude Code for Web clones the superpowers repository to the user's home directory:

1. User clones the repository to `~/.claude/skills/superpowers/`
2. Skills are available at `~/.claude/skills/superpowers/skills/<skill-name>/SKILL.md`
3. At each session start, user tells Claude to read the using-superpowers skill
4. Skills persist across sessions and update via `git pull`

Directory structure after installation:
```
~/.claude/skills/superpowers/
├── skills/
│   ├── brainstorming/
│   │   └── SKILL.md
│   ├── test-driven-development/
│   │   └── SKILL.md
│   └── ... (all skills)
├── .claude-code-for-web/
├── lib/
└── ...
```

## Limitations

### Fully Working

- All skill content is installed locally
- Skills persist across sessions
- Core workflows (brainstorming, TDD, debugging) work as documented
- Tool mapping guidance helps adapt skills to available tools

### Partially Working

| Feature | CLI Version | Web Version |
|---------|-------------|-------------|
| Auto-bootstrap at session start | Automatic via hook | Manual (user must request) |
| Skill discovery | `Skill` tool lists all | Read directory listing |
| Personal/custom skills | `~/.claude/skills/` | Supported (same location) |
| Project skills | `.claude/skills/` | May work if project filesystem accessible |

### Not Available

| Feature | Reason |
|---------|--------|
| **Subagent dispatch** | `Task` tool not available in web |
| **Git worktrees** | No shell access for git commands |
| **Running tests** | No shell access for test runners |
| **Automatic session hooks** | No hook execution environment |

### Skill-Specific Limitations

Some skills are less useful or non-functional in Claude Code for Web:

- **using-git-worktrees** - Requires git CLI access
- **dispatching-parallel-agents** - Requires Task tool with subagents
- **subagent-driven-development** - Requires Task tool
- **executing-plans** - Requires shell access for verification steps
- **finishing-a-development-branch** - Requires git operations

These skills can still be read for educational purposes, but their workflows cannot be fully executed.

## Files in This Directory

| File | Purpose |
|------|---------|
| `INSTALL.md` | Human-readable installation guide; entry point for Claude |
| `README.md` | This file - overview and limitations |
| `bootstrap.md` | Instructions Claude follows to install and use skills |
| `DOT-CLAUDE-DOCS.md` | Documentation of the `~/.claude` directory structure |

## Recommended Workflow for Web Users

1. **First time**: Clone the repository per INSTALL.md instructions
2. **Start of conversation**: Tell Claude to read `~/.claude/skills/superpowers/skills/using-superpowers/SKILL.md`
3. **Before any task**: Ask Claude to check for relevant skills
4. **When a skill applies**: Have Claude read and follow it
5. **For complex work**: Consider using Claude Code CLI instead for full functionality

## Updating Skills

To update to the latest skills:
```bash
cd ~/.claude/skills/superpowers
git pull
```

## Getting Help

- **Issues**: https://github.com/obra/superpowers/issues
- **Main Documentation**: https://github.com/obra/superpowers
- **CLI Installation**: See main README.md for full-featured CLI installation
