# Superpowers for Kimi Code CLI

Guide for using Superpowers with Kimi Code CLI via native skill discovery.

## Quick Install

Tell Kimi:

```
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/docs/README.kimi.md
```

## Manual Installation

### Prerequisites

- Kimi Code CLI 1.12+ (skill discovery support)
- Git

### Steps

1. Clone the repo:
   ```bash
   git clone https://github.com/obra/superpowers.git ~/.config/agents/superpowers
   ```

2. Create the skills symlink:
   ```bash
   mkdir -p ~/.config/agents/skills
   ln -s ~/.config/agents/superpowers/skills ~/.config/agents/skills/superpowers
   ```

3. Restart Kimi Code CLI.

### Windows

Use a junction instead of a symlink (works without Developer Mode):

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.config\agents\skills"
cmd /c mklink /J "$env:USERPROFILE\.config\agents\skills\superpowers" "$env:USERPROFILE\.config\agents\superpowers\skills"
```

## How It Works

Kimi Code CLI has native skill discovery — it scans `~/.config/agents/skills/` at startup, parses SKILL.md frontmatter, and loads skills on demand. Superpowers skills are made visible through a single symlink:

```
~/.config/agents/skills/superpowers/ → ~/.config/agents/superpowers/skills/
```

The `using-superpowers` skill is discovered automatically and enforces skill usage discipline — no additional configuration needed.

### Alternative skill directories

Kimi Code CLI also scans `~/.kimi/skills/` and `~/.claude/skills/`. If you prefer one of those locations, adjust the symlink target accordingly.

To load skills from multiple brand directories simultaneously, enable in your Kimi config:

```toml
merge_all_available_skills = true
```

You can also pass additional skill directories at launch:

```bash
kimi --skills-dir /path/to/more-skills
```

## Usage

Skills are discovered automatically. Kimi activates them when:
- You mention a skill by name (e.g., "use brainstorming")
- The task matches a skill's description
- The `using-superpowers` skill directs Kimi to use one

Invoke a skill manually with the `/skill` slash command:

```
/skill:brainstorming
/skill:writing-plans
/skill:test-driven-development
```

### Personal Skills

Create your own skills in `~/.config/agents/skills/`:

```bash
mkdir -p ~/.config/agents/skills/my-skill
```

Create `~/.config/agents/skills/my-skill/SKILL.md`:

```markdown
---
name: my-skill
description: Use when [condition] - [what it does]
---

# My Skill

[Your skill content here]
```

The `description` field is how Kimi decides when to activate a skill automatically — write it as a clear trigger condition.

## Limitations

- **Skill tool**: Kimi CLI uses `/skill:name` slash commands instead of a `Skill` tool. See `references/kimi-tools.md` for the full tool mapping.
- **Task management**: Kimi uses `SetTodoList` (full list replacement) rather than Claude Code's per-task CRUD tools. Skills that reference `TaskCreate`/`TaskUpdate` work — just use `SetTodoList` to update the full list.
- **Named agents**: Subagent skills dispatch using Kimi's `coder`/`explore`/`plan` types with the agent's prompt template as content.
- **NotebookEdit**: No equivalent in Kimi CLI.

## Updating

```bash
cd ~/.config/agents/superpowers && git pull
```

Skills update instantly through the symlink.

## Uninstalling

```bash
rm ~/.config/agents/skills/superpowers
```

**Windows (PowerShell):**
```powershell
Remove-Item "$env:USERPROFILE\.config\agents\skills\superpowers"
```

Optionally delete the clone: `rm -rf ~/.config/agents/superpowers`

## Troubleshooting

### Skills not showing up

1. Verify the symlink: `ls -la ~/.config/agents/skills/superpowers`
2. Check skills exist: `ls ~/.config/agents/superpowers/skills`
3. Restart Kimi Code CLI — skills are discovered at startup
4. Check Kimi CLI version: `kimi --version` (requires 1.12+)

### Windows junction issues

Junctions normally work without special permissions. If creation fails, try running PowerShell as administrator.

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Main documentation: https://github.com/obra/superpowers
