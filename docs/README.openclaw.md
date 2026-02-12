# Superpowers for OpenClaw

Complete guide for using Superpowers with [OpenClaw](https://docs.openclaw.ai).

## What is OpenClaw?

OpenClaw is a local-first assistant runtime that can run coding-agent workflows with built-in tools, session management, and skill discovery. Learn more at https://docs.openclaw.ai.

## Quick Install

Tell OpenClaw:

```
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.openclaw/INSTALL.md
```

## Manual Installation

### Prerequisites

- OpenClaw installed
- Git

### macOS / Linux / WSL

```bash
# 1. Install Superpowers (or update existing)
if [ -d ~/.openclaw/superpowers/.git ]; then
  git -C ~/.openclaw/superpowers pull --ff-only
else
  git clone https://github.com/obra/superpowers.git ~/.openclaw/superpowers
fi

# 2. Ensure OpenClaw workspace skills directory exists
mkdir -p ~/.openclaw/workspace/skills

# 3. Remove existing superpowers target
rm -rf ~/.openclaw/workspace/skills/superpowers

# 4. Link skills (fallback to copy if symlink is unavailable)
ln -s ~/.openclaw/superpowers/skills ~/.openclaw/workspace/skills/superpowers 2>/dev/null \
  || cp -R ~/.openclaw/superpowers/skills ~/.openclaw/workspace/skills/superpowers

# 5. Start a new session (or restart gateway)
# openclaw gateway restart
```

### Verify Installation

```bash
ls -la ~/.openclaw/workspace/skills/superpowers
```

## How OpenClaw Discovers and Triggers Skills

OpenClaw discovers skills from the workspace `skills/` directory at session start.

For each skill directory, OpenClaw reads `SKILL.md` and uses YAML frontmatter fields (especially `name` and `description`) to determine:

- Skill identity in the registry
- Whether the skill should activate for a user request

The `description` field acts as the trigger contract. If a request matches that description, OpenClaw can select and apply the skill automatically.

## Differences from Claude Code Usage

Superpowers skill text is unchanged. The adaptation is in runtime behavior:

- Claude Code workflows may reference `Task(...)` for subagents.
- In OpenClaw, subagent execution maps to `sessions_spawn`.

This means OpenClaw keeps the same high-level workflow while using its native session/subagent primitive.

## Updating

```bash
cd ~/.openclaw/superpowers && git pull
```

If your install uses copy mode instead of symlink mode, re-run the install steps after pulling.

## Troubleshooting

### Skills are not showing up

1. Check directory exists: `ls -la ~/.openclaw/workspace/skills/superpowers`
2. Confirm skill files: `ls ~/.openclaw/superpowers/skills`
3. Start a new OpenClaw session (or restart gateway)

### Symlink creation fails

If symlinks are restricted on your system, copy mode is supported by the installation script and manual steps.

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Main documentation: https://github.com/obra/superpowers
- OpenClaw docs: https://docs.openclaw.ai
