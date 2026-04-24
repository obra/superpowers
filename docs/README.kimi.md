# Superpowers for Kimi Code 2.6

Complete guide for using Superpowers with [Kimi Code](https://www.moonshot.cn/kimi) (terminal CLI or VS Code extension).

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/obra/superpowers.git ~/.kimi/superpowers
```

### 2. Run the install script

The install script copies skills to the cross-compatible `~/.config/agents/skills/` directory and configures a global `SessionStart` hook for bootstrap injection.

**macOS / Linux:**
```bash
~/.kimi/superpowers/.kimi/install.sh
```

**Windows (PowerShell):**
```powershell
& "$env:USERPROFILE\.kimi\superpowers\.kimi\install.ps1"
```

What the script does:
- Copies all skills from the repo to `~/.config/agents/skills/` (the recommended, cross-tool skills path)
- Enables `merge_all_available_skills` in `~/.kimi/config.toml`
- Adds a `SessionStart` hook that injects the Superpowers bootstrap into every session

> **Note:** No symlinks or junctions are created. Skills are copied so they work reliably across all platforms and filesystems.

### 3. Verify

Start Kimi Code in any project directory and ask:

```
Tell me about your superpowers
```

Or try loading a skill explicitly:

```
/skill:using-superpowers
```

You should see the skill content load and the agent announce it.

## Usage

### Finding Skills

Kimi Code auto-discovers skills at startup from `~/.config/agents/skills/`. Their names, paths, and descriptions are injected into the system prompt automatically.

The Superpowers bootstrap tells Kimi: **when a skill description matches your current task, you MUST read its full `SKILL.md` automatically before responding.** This ensures skills trigger without explicit user commands.

Skills are installed globally at `~/.config/agents/skills/`:

```
~/.config/agents/skills/
  brainstorming/SKILL.md
  writing-plans/SKILL.md
  test-driven-development/SKILL.md
  ...
```

Kimi Code discovers them from the global path automatically at startup.

### Loading a Skill

For regular conversations, Kimi Code automatically decides whether to read skill content based on context.

To explicitly load a skill, use the `/skill:<name>` slash command:

```
/skill:brainstorming
/skill:test-driven-development
/skill:subagent-driven-development
```

You can also append a task description:

```
/skill:brainstorming design a new caching layer
```

### Personal Skills

Create your own skills in `~/.config/agents/skills/` (global) or `.kimi/skills/` (project-level):

```bash
mkdir -p .kimi/skills/my-skill
```

Create `.kimi/skills/my-skill/SKILL.md`:

```markdown
---
name: my-skill
description: Use when [condition] - [what it does]
---

# My Skill

[Your skill content here]
```

Restart Kimi Code to discover new skills.

## Updating

Pull the latest changes and re-run the install script:

**macOS / Linux:**
```bash
~/.kimi/superpowers/.kimi/update.sh
```

**Windows (PowerShell):**
```powershell
& "$env:USERPROFILE\.kimi\superpowers\.kimi\update.ps1"
```

This re-copies skills from the latest repo state and ensures your hook is up to date.

## How It Works

1. **Bootstrap injection** via a global `SessionStart` hook — The hook runs at the start of every Kimi Code session and injects the `using-superpowers` skill content plus tool mapping into the conversation context.
2. **Skill discovery** — Kimi Code scans `~/.config/agents/skills/` at startup, parses `SKILL.md` frontmatter, and injects skill metadata into the system prompt. The AI reads skill content automatically when relevant.

### Tool Mapping

Skills written for Claude Code are adapted for Kimi Code via the bootstrap:

| Claude Code | Kimi Code 2.6 |
|-------------|---------------|
| `Read` | `ReadFile` |
| `Write` | `WriteFile` |
| `Edit` | `StrReplaceFile` |
| `Bash` | `Shell` |
| `Grep` | `Grep` |
| `Glob` | `Glob` |
| `TodoWrite` | `SetTodoList` |
| `Task` (subagent) | `Agent` |
| `WebSearch` | `SearchWeb` |
| `WebFetch` | `FetchURL` |
| `Skill` tool | Auto-discovery + `/skill:<name>` |

## Project-Level Bootstrap (Optional)

If you prefer project-level bootstrap instead of (or in addition to) the global hook, copy the bootstrap file into your project:

```bash
mkdir -p .kimi
cp ~/.kimi/superpowers/.kimi/AGENTS.md .kimi/AGENTS.md
```

**Windows (PowerShell):**
```powershell
New-Item -ItemType Directory -Force -Path ".kimi"
Copy-Item "$env:USERPROFILE\.kimi\superpowers\.kimi\AGENTS.md" ".kimi\AGENTS.md"
```

This file is **not** overwritten by `/init` and is auto-merged into Kimi Code's system prompt at session start.

## Troubleshooting

### Bootstrap not appearing

1. Confirm the SessionStart hook is in `~/.kimi/config.toml`
2. Restart Kimi Code (hooks are read at session start)
3. If using the VS Code extension, run "Developer: Reload Window" from the Command Palette
4. As a fallback, copy `.kimi/AGENTS.md` into your project directory

### Skills not showing up

1. Verify skills exist: `ls ~/.config/agents/skills/` or `dir $env:USERPROFILE\.config\agents\skills\`
2. Check that `merge_all_available_skills = true` is set in `~/.kimi/config.toml`
3. Restart Kimi Code — skills are discovered at startup
4. Try `/skill:using-superpowers` to confirm skills are accessible

### `/init` overwrote root AGENTS.md

This is expected. `/init` only overwrites root `AGENTS.md`; it does not touch `.kimi/AGENTS.md`, the global SessionStart hook, or your skills installation.

If you want to restore the upstream minimal root `AGENTS.md`:

```bash
git checkout AGENTS.md
```

### Subagent skills failing

Ensure your Kimi Code version supports the `Agent` tool. Check by trying:
```
Agent subagent_type="explore" description="test" prompt="List files in the current directory"
```

### Tool mapping issues

See `.kimi/TOOL_MAPPING.md` for the complete tool mapping reference.

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Main documentation: https://github.com/obra/superpowers
- Kimi Code CLI docs: https://moonshotai.github.io/kimi-cli/
