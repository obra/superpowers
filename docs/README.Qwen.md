# Superpowers for Qwen Code

Complete guide for using Superpowers with [Qwen Code](https://qwenlm.github.io/).

## Installation

Tell Qwen:

```
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.qwen/INSTALL.md
```

### Manual Installation

1. Clone the repo:
   ```bash
   git clone https://github.com/obra/superpowers.git ~/.qwen/superpowers
   ```

2. Create the skills symlink:
   ```bash
   mkdir -p ~/.qwen/skills
   ln -s ~/.qwen/superpowers/skills ~/.qwen/skills/superpowers
   ```

3. Restart Qwen.

### Verify Installation

Start a new session and ask: "Tell me about your superpowers"

Or try something that should trigger a skill, like "help me plan this feature" — the brainstorming skill should activate automatically.

## How It Works

Qwen Code has native skill discovery — it scans `~/.qwen/skills/` at startup, parses SKILL.md frontmatter, and loads skills on demand. Superpowers skills are made visible through a single symlink:

```
~/.qwen/skills/superpowers/ → ~/.qwen/superpowers/skills/
```

The `using-superpowers` skill is discovered automatically and enforces skill usage discipline — no additional configuration needed.

## Usage

Skills are discovered automatically. Qwen activates them when:
- You mention a skill by name (e.g., "use brainstorming")
- The task matches a skill's description
- The `using-superpowers` skill directs Qwen to use one

### Slash Commands

Superpowers provides slash commands for Qwen Code in the `.qwen/commands/` directory:

| Command | Description |
|---|---|
| `/superpowers` | Main entry point |
| `/superpowers:brainstorm` | Design exploration BEFORE any creative work |
| `/superpowers:plan` | Write comprehensive implementation plans |
| `/superpowers:execute` | Execute plans using subagent-driven development |
| `/superpowers:help` | List all commands and functionality |

### Personal Skills

Create your own skills in `~/.qwen/skills/`:

```bash
mkdir -p ~/.qwen/skills/my-skill
```

Create `~/.qwen/skills/my-skill/SKILL.md`:

```markdown
---
name: my-skill
description: Use when [condition] - [what it does]
---

# My Skill

[Your skill content here]
```

The `description` field is how Qwen decides when to activate a skill automatically — write it as a clear trigger condition.

## Subagent Support

Qwen Code supports subagent dispatch via the built-in `general-purpose` subagent. Skills that dispatch subagents work automatically — Qwen decides when to delegate.

For subagent-driven development:
- Fresh subagent per task (recommended for multi-task plans)
- Two-stage review between tasks (spec compliance, then code quality)
- Qwen manages subagent lifecycle automatically

## Updating

```bash
cd ~/.qwen/superpowers && git pull
```

Skills update instantly through the symlink.

## Uninstalling

```bash
rm ~/.qwen/skills/superpowers
```

Optionally delete the clone: `rm -rf ~/.qwen/superpowers`

## Tool Mapping

Skills use Qwen tool names natively. Key mappings:

| Skill references | Qwen equivalent |
|-----------------|------------------|
| `TodoWrite` | `todo_write` (built-in) |
| `Read`, `Write`, `Edit` (files) | `read_file`, `write_file`, `edit` |
| `Bash` / shell | `run_shell_command` |
| `Task` (subagent dispatch) | Qwen's built-in subagent system |

For the complete tool mapping reference, see `skills/using-superpowers/references/qwen-tools.md`.

## Troubleshooting

### Skills not showing up

1. Verify the symlink: `ls -la ~/.qwen/skills/superpowers`
2. Check skills exist: `ls ~/.qwen/superpowers/skills`
3. Restart Qwen — skills are discovered at startup

### Subagents not working

Qwen's subagent system works automatically. If you notice issues:
- Ensure you're using a model that supports subagent dispatch
- The `subagent-driven-development` skill works with Qwen's native subagent system

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Main documentation: https://github.com/obra/superpowers
- Installation guide: https://github.com/obra/superpowers/blob/main/.qwen/INSTALL.md
