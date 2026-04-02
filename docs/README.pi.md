# Superpowers for Pi

> **Experimental.** Pi support is new. Report issues at <https://github.com/obra/superpowers/issues>.

Complete guide for using Superpowers with [pi](https://github.com/mariozechner/pi-coding-agent).

## Quick Install

```bash
pi install https://github.com/obra/superpowers
```

Pi clones the repository and discovers all skills from the `skills/` directory automatically. No plugins, hooks, or bootstrap scripts required for skill loading. For subagent-based workflows, install the bundled agent profile from `.pi/agents/`.

## Installation Options

### Prerequisites

- [Pi](https://github.com/mariozechner/pi-coding-agent) installed
- Git

### Option A: Git Package (recommended)

```bash
pi install https://github.com/obra/superpowers
```

This clones to `~/.pi/agent/git/github.com/obra/superpowers/` and adds the package to `~/.pi/agent/settings.json`.

### Option B: Local Path

If you already have a local clone:

```bash
pi install /path/to/superpowers
```

### Option C: Symlink Skills Only

To add superpowers skills alongside an existing skill tree:

```bash
ln -s /path/to/superpowers/skills ~/.pi/agent/skills/superpowers
```

> **Note:** Symlinked skills are not managed by `pi update` or shown by `pi list`. Update manually with `git pull`.

### Verify Installation

Check the package appears:

```bash
pi list
```

Then start pi and type `/skill:brainstorming` to confirm skills load.

### Configure Required Subagent Profiles

Some Superpowers skills dispatch a `code-reviewer` subagent.

| Agent profile | Used by |
|---|---|
| `code-reviewer` | `requesting-code-review` and workflows that depend on it |

Pi packages do not auto-install agent profiles, so install the bundled profile once:

If installed from GitHub:

```bash
mkdir -p ~/.pi/agent/agents
ln -sf ~/.pi/agent/git/github.com/obra/superpowers/.pi/agents/code-reviewer.md ~/.pi/agent/agents/code-reviewer.md
```

If installed from a local path:

```bash
mkdir -p ~/.pi/agent/agents
ln -sf /path/to/superpowers/.pi/agents/code-reviewer.md ~/.pi/agent/agents/code-reviewer.md
```

Verify:

```bash
ls ~/.pi/agent/agents/code-reviewer.md
```

## Usage

### Finding Skills

Pi lists available skills at startup in the `<available_skills>` section of the system prompt. The agent sees skill names and descriptions automatically.

### Loading a Skill

Three ways:

1. **Automatic** — the agent reads a matching skill when a task fits its description
2. **Command** — type `/skill:brainstorming` (or any skill name)
3. **Direct** — the agent uses `read` on the SKILL.md file

### Personal Skills

Create skills in `~/.pi/agent/skills/`:

```bash
mkdir -p ~/.pi/agent/skills/my-skill
```

Create `~/.pi/agent/skills/my-skill/SKILL.md`:

```markdown
---
name: my-skill
description: Use when [condition] - [what it does]
---

# My Skill

[Your skill content here]
```

### Project Skills

Create project-specific skills in `.pi/skills/` within your project.

## Tool Mapping

Skills are written for Claude Code. Pi equivalents:

| Claude Code | Pi | Notes |
|---|---|---|
| `Skill` tool | `read` tool / `/skill:name` | Pi loads skill content via `read` |
| `TodoWrite` | — | No direct equivalent; use markdown checklists |
| `Task` with subagents | `subagent` tool | Requires a subagent extension and matching agent profiles (for example `code-reviewer`) |
| `Read` | `read` | Same |
| `Write` | `write` | Same |
| `Edit` | `edit` | Same |
| `Bash` | `bash` | Same |

### Subagent Differences

Pi core does not include built-in subagents. If your Pi harness provides a `subagent` tool, it maps to Claude Code's `Task` behavior.

Pi `subagent` tools typically provide three modes:

- **single** — one agent, one task (closest to Claude Code's `Task`)
- **parallel** — multiple independent tasks
- **chain** — sequential tasks where each receives prior output

## Architecture

Pi's package system discovers superpowers with zero integration code:

1. `pi install` clones the repo
2. Pi scans the `skills/` directory (convention-based discovery)
3. Each `SKILL.md` frontmatter is parsed for name and description
4. Skills appear in the system prompt's `<available_skills>` XML
5. The agent loads full skill content on demand via `read`

No plugins, hooks, bootstrap scripts, or CLI wrappers needed.

### Skill Locations

Pi discovers skills from multiple locations. On name collision, the first skill found wins. See [pi's skill documentation](https://github.com/mariozechner/pi-coding-agent/blob/main/docs/skills.md) for authoritative loading order.

- **Global** — `~/.pi/agent/skills/`
- **Project** — `.pi/skills/`
- **Settings/Packages** — `skills` array and installed packages
- **CLI** — `--skill <path>`

### Harness-Specific Files

Pi-specific resources live in `.pi/` in this repository:

- `.pi/INSTALL.md`
- `.pi/agents/code-reviewer.md`

If we add Pi-specific extensions later, they should live under `.pi/extensions/`.

## Updating

```bash
pi update
```

`pi update` updates all installed packages. To update only Superpowers:

```bash
pi update https://github.com/obra/superpowers
```

For local path installs, pull manually:

```bash
cd /path/to/superpowers && git pull
```

## Uninstalling

```bash
pi remove https://github.com/obra/superpowers
```

For symlink installs:

```bash
rm ~/.pi/agent/skills/superpowers
```

## Troubleshooting

### Skills not found

1. Check package is installed: `pi list`
2. Check skills exist: `ls ~/.pi/agent/git/github.com/obra/superpowers/skills/`
3. Verify each skill has a `SKILL.md` with valid frontmatter

### Skill not triggering automatically

Pi includes skill descriptions in the system prompt but relies on the model to decide when to load them. Use `/skill:name` to load explicitly.

### Tool mapping confusion

If the agent attempts a Claude Code tool that doesn't exist in pi, remind it of the mapping above.

## Known Differences from Claude Code

- **No `TodoWrite`** — Pi has no built-in task tracking tool. Skills that use `TodoWrite` checklists produce markdown checklists instead.
- **No hooks system** — Pi doesn't inject bootstrap content on session start. The `using-superpowers` skill triggers via its description in `<available_skills>`.
- **Skill loading** — Claude Code has a dedicated `Skill` tool. Pi uses `read` on SKILL.md files. Functionally equivalent, syntactically different.
- **Subagent model** — Pi core does not include built-in subagents. If your harness provides a `subagent` tool, Claude Code's `Task` usually maps to single mode.
- **Agent profiles** — Pi packages do not auto-install agent profiles. Superpowers ships required Pi profiles in `.pi/agents/`; install them in `~/.pi/agent/agents/`.

## Getting Help

- Report issues: <https://github.com/obra/superpowers/issues>
- Main documentation: <https://github.com/obra/superpowers>
- Pi documentation: <https://github.com/mariozechner/pi-coding-agent>
