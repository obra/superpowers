# Superpowers for Antigravity

Complete guide for using Superpowers with Google Antigravity.

## Quick Install

Tell Antigravity:

```
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.antigravity/INSTALL.md
```

## Manual Installation

### Prerequisites

- Google Antigravity installed
- Git installed

### macOS / Linux

```bash
# 1. Clone Superpowers
git clone https://github.com/obra/superpowers.git ~/.antigravity/superpowers

# 2. Create skills directory
mkdir -p ~/.agents/skills

# 3. Create skills symlink
ln -s ~/.antigravity/superpowers/skills ~/.agents/skills/superpowers

# 4. Install global workflow bootstrap
mkdir -p ~/.gemini/antigravity/global_workflows
cp ~/.antigravity/superpowers/skills/using-superpowers/SKILL.md ~/.gemini/antigravity/global_workflows/superpowers.md

# 5. Restart Antigravity
```

#### Verify Installation

```bash
ls -la ~/.agents/skills/superpowers
```

Should show a symlink pointing to the superpowers skills directory.

### Windows

Use a junction instead of a symlink (works without Developer Mode):

```powershell
# 1. Clone Superpowers
git clone https://github.com/obra/superpowers.git "$env:USERPROFILE\.antigravity\superpowers"

# 2. Create skills directory
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.agents\skills"

# 3. Create skills junction
cmd /c mklink /J "$env:USERPROFILE\.agents\skills\superpowers" "$env:USERPROFILE\.antigravity\superpowers\skills"

# 4. Install global workflow bootstrap
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.gemini\antigravity\global_workflows"
Copy-Item "$env:USERPROFILE\.antigravity\superpowers\skills\using-superpowers\SKILL.md" "$env:USERPROFILE\.gemini\antigravity\global_workflows\superpowers.md"

# 5. Restart Antigravity
```

#### Verify Installation (Windows)

```powershell
Get-ChildItem "$env:USERPROFILE\.agents\skills" | Where-Object { $_.LinkType }
```

Look for `<JUNCTION>` in the output.

## How It Works

Superpowers uses a two-layer discovery mechanism in Antigravity:

1. **Global workflow bootstrap** (`~/.gemini/antigravity/global_workflows/superpowers.md`) — Antigravity's `global_workflows` directory is a native feature where any `.md` file is loaded into every conversation regardless of workspace. The `using-superpowers` skill is copied here so it fires at the start of every session, enforcing skill usage discipline.

2. **Native skill discovery** (`~/.agents/skills/superpowers/` → `~/.antigravity/superpowers/skills/`) — All skills are symlinked into Antigravity's standard skill discovery path. The bootstrap directs Antigravity to load specific skills as needed.

The global workflow fires first and enforces that relevant skills are checked before any response. The symlinked skills provide the full skill library on demand.

## Usage

Skills are discovered automatically. Antigravity activates them when:

- You mention a skill by name (e.g., "use brainstorming")
- The task matches a skill's description
- The `using-superpowers` skill directs Antigravity to use one

### Personal Skills

Create your own skills in `.agents/skills/`:

```bash
mkdir -p ~/.agents/skills/my-skill
```

Create `~/.agents/skills/my-skill/SKILL.md`:

```markdown
---
name: my-skill
description: Use when [condition] - [what it does]
---

# My Skill

[Your skill content here]
```

The `description` field is how Antigravity decides when to activate a skill automatically — write it as a clear trigger condition.

### Project Skills

Create project-specific skills in `.agents/skills/` within your project directory. Project skills take priority over personal and superpowers skills.

## Tool Mapping

Skills are written for Claude Code. When using them in Antigravity, map tools as follows:

| Claude Code              | Antigravity                                                              |
| ------------------------ | ------------------------------------------------------------------------ |
| `Skill` tool             | `view_file` on SKILL.md files                                            |
| `TodoWrite` / `TodoRead` | `task.md` artifact system                                                |
| `Task` with subagents    | `browser_subagent` for browser tasks; self-orchestration for code tasks  |
| `CLAUDE.md` / `AGENTS.md`| User rules / `.agents/` config                                           |
| File operations          | Native file tools (`view_file`, `replace_file_content`, `write_to_file`) |

### Subagent Considerations

> [!NOTE]
> Antigravity does not currently support spawning independent coding subagents the way Claude Code does. Skills that rely on multi-agent dispatch (like `subagent-driven-development` and `dispatching-parallel-agents`) will still work, but the main agent handles all tasks sequentially using a self-orchestration pattern — treating each task as isolated with two-stage review gates between them. The only true subagent available is `browser_subagent`, which can be delegated browser-based tasks (UI verification, screenshots, interactive testing). This is a platform-level limitation, not a Superpowers issue, and may change as Antigravity evolves.

When skills reference subagent dispatch:

- **Browser tasks:** Use `browser_subagent` for UI verification, screenshots, and interactive testing
- **Code tasks:** Use self-orchestration — treat each plan task as isolated, enforce the two-stage review gates (spec compliance → code quality) inline
- **Task tracking:** Use `task.md` artifacts instead of `TodoWrite`

## Updating

```bash
cd ~/.antigravity/superpowers && git pull
```

Skills update instantly through the symlink. However, the global workflow bootstrap is a copy, not a symlink. After pulling, re-copy it if it changed:

```bash
cp ~/.antigravity/superpowers/skills/using-superpowers/SKILL.md ~/.gemini/antigravity/global_workflows/superpowers.md
```

**Windows (PowerShell):**
```powershell
Copy-Item "$env:USERPROFILE\.antigravity\superpowers\skills\using-superpowers\SKILL.md" "$env:USERPROFILE\.gemini\antigravity\global_workflows\superpowers.md"
```

## Uninstalling

```bash
rm ~/.agents/skills/superpowers
rm ~/.gemini/antigravity/global_workflows/superpowers.md
```

**Windows (PowerShell):**
```powershell
Remove-Item "$env:USERPROFILE\.agents\skills\superpowers"
Remove-Item "$env:USERPROFILE\.gemini\antigravity\global_workflows\superpowers.md"
```

Optionally delete the clone: `rm -rf ~/.antigravity/superpowers` (Windows: `Remove-Item -Recurse -Force "$env:USERPROFILE\.antigravity\superpowers"`).

## Troubleshooting

### Skills not showing up

1. Verify the symlink: `ls -la ~/.agents/skills/superpowers`
2. Check skills exist: `ls ~/.antigravity/superpowers/skills`
3. Restart Antigravity — skills are discovered at startup

### Windows junction issues

Junctions normally work without special permissions. If creation fails, try running PowerShell as administrator.

### Symlinks not working after git clone

Run `git config --global core.symlinks true` and re-clone.

## Getting Help

- Report issues: <https://github.com/obra/superpowers/issues>
- Main documentation: <https://github.com/obra/superpowers>
