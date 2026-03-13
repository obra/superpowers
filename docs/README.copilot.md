# Superpowers for GitHub Copilot CLI

Guide for using Superpowers with GitHub Copilot CLI via native plugin discovery.

## Quick Install

```text
/plugin install obra/superpowers
```

All skills become `/skill-name` slash commands immediately.

## Manual Installation

### Prerequisites

- GitHub Copilot CLI (`copilot` command)
- Git

### Steps

1. Clone the repo:
   ```bash
   git clone https://github.com/obra/superpowers.git ~/.copilot/superpowers
   ```

2. Create the skills symlink:
   ```bash
   mkdir -p ~/.copilot/skills
   ln -s ~/.copilot/superpowers/skills ~/.copilot/skills/superpowers
   ```

3. Restart Copilot CLI.

### Windows

Use a junction instead of a symlink (works without Developer Mode):

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.copilot\skills"
cmd /c mklink /J "$env:USERPROFILE\.copilot\skills\superpowers" "$env:USERPROFILE\.copilot\superpowers\skills"
```

## How It Works

Copilot CLI has native plugin discovery — it reads `plugin.json` at the repository root, discovers the skills directory, registers each skill as a slash command, and loads configured hooks (e.g., `sessionStart` for update checks). The `using-superpowers` skill is discovered automatically and enforces skill usage discipline — no additional configuration needed.

```text
plugin.json → skills/ + hooks/ → /skill-name slash commands + session hooks
```

## Usage

Skills activate in three ways:

- **Direct invocation:** Type `/brainstorming`, `/test-driven-development`, etc.
- **Task-based auto-invocation:** The agent recognizes when a task matches a skill's description
- **`using-superpowers` direction:** This meta-skill directs the agent to check for relevant skills before any action

### Available Slash Commands

| Slash Command | Purpose |
|--------------|---------|
| `/brainstorming` | Explore intent, requirements, and design before implementation |
| `/dispatching-parallel-agents` | Run 2+ independent tasks concurrently via subagents |
| `/executing-plans` | Execute implementation plans with review checkpoints |
| `/finishing-a-development-branch` | Guide merge, PR, or cleanup when work is complete |
| `/receiving-code-review` | Handle code review feedback with technical rigor |
| `/requesting-code-review` | Pre-review checklist before merging |
| `/subagent-driven-development` | Fast iteration with two-stage review |
| `/systematic-debugging` | 4-phase root cause debugging process |
| `/test-driven-development` | RED-GREEN-REFACTOR cycle enforcement |
| `/using-git-worktrees` | Create isolated workspaces for feature work |
| `/using-superpowers` | Introduction to the skills system |
| `/verification-before-completion` | Verify work before claiming success |
| `/writing-plans` | Create detailed implementation plans from specs |
| `/writing-skills` | Create or edit skills following best practices |

### Personal Skills

Create your own skills in `~/.copilot/skills/`:

```bash
mkdir -p ~/.copilot/skills/my-skill
```

Create `~/.copilot/skills/my-skill/SKILL.md`:

```markdown
---
name: my-skill
description: Use when [condition] - [what it does]
---

# My Skill

[Your skill content here]
```

The `description` field is how Copilot CLI decides when to activate a skill automatically — write it as a clear trigger condition.

Personal skills with the `superpowers:` prefix shadow built-in skills of the same name.

## Tool Mapping

Most tools share identical names between Claude Code and Copilot CLI. The main difference is skill invocation — use `/skill-name` slash commands instead of the `Skill` tool.

See `skills/using-superpowers/references/copilot-tools.md` for the full mapping.

## Updating

**Plugin install:**
```text
/plugin update superpowers
```

**Manual install:**
```bash
cd ~/.copilot/superpowers && git pull
```

Skills update instantly through the symlink.

## Uninstalling

**Plugin install:**
```text
/plugin uninstall superpowers
```

**Manual install:**
```bash
rm ~/.copilot/skills/superpowers
```

**Windows (PowerShell):**
```powershell
Remove-Item "$env:USERPROFILE\.copilot\skills\superpowers"
```

Optionally delete the clone: `rm -rf ~/.copilot/superpowers` (Windows: `Remove-Item -Recurse -Force "$env:USERPROFILE\.copilot\superpowers"`).

## Troubleshooting

### Plugin install issues

1. Ensure Copilot CLI is up to date
2. Try `/plugin list` to check if superpowers is registered
3. Restart Copilot CLI after installation

### Manual install issues

1. Verify the symlink: `ls -la ~/.copilot/skills/superpowers`
2. Check skills exist: `ls ~/.copilot/superpowers/skills`
3. Restart Copilot CLI — skills are discovered at startup

### Windows junction issues

Junctions normally work without special permissions. If creation fails, try running PowerShell as administrator.

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Main documentation: https://github.com/obra/superpowers
